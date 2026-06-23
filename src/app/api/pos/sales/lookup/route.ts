import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import {
  guardPharmacyFeatureForUser,
  handleEntitlementRouteError,
} from "@/lib/subscription/api-guard";
import {
  storeLookupPosSale,
  storeSumReturnedBySaleItem,
} from "@/lib/db/pos-store";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const receipt = url.searchParams.get("receipt")?.trim();
    const saleId = url.searchParams.get("saleId")?.trim();
    const branchId = url.searchParams.get("branchId")?.trim();

    if (!receipt && !saleId) {
      return NextResponse.json(
        { error: "receipt or saleId is required" },
        { status: 400 },
      );
    }

    const { pharmacyId } = await guardPharmacyFeatureForUser(user.id, {
      feature: "pos.returns",
      branchId: branchId ?? undefined,
    });

    const lookup = await storeLookupPosSale({
      pharmacyId,
      saleId,
      receipt,
      branchId,
    });

    if (!lookup) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    const sale = lookup.sale;
    const items = lookup.items as Array<{
      id: string;
      inventory_id: string | null;
      medication_name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      batch_number: string | null;
      expiry_date: string | Date | null;
    }>;

    const returnedBySaleItem = await storeSumReturnedBySaleItem(
      String(sale.id),
    );

    return NextResponse.json({
      sale: {
        id: sale.id,
        receiptNumber: sale.receipt_number,
        customerName: sale.customer_name,
        customerPhone: sale.customer_phone,
        totalAmount: sale.total_amount,
        paymentMethod: sale.payment_method,
        branchId: sale.branch_id,
        createdAt: sale.created_at,
        items: items.map((item) => ({
          saleItemId: item.id,
          inventoryId: item.inventory_id,
          name: item.medication_name,
          quantitySold: item.quantity,
          quantityReturned: returnedBySaleItem[item.id] ?? 0,
          quantityAvailable:
            item.quantity - (returnedBySaleItem[item.id] ?? 0),
          unitPrice: item.unit_price,
          batch: item.batch_number,
          expiryDate:
            item.expiry_date instanceof Date
              ? item.expiry_date.toISOString().slice(0, 10)
              : item.expiry_date,
        })),
      },
    });
  } catch (error) {
    const entitlement = handleEntitlementRouteError(error);
    if (entitlement) return entitlement;
    console.error("GET /api/pos/sales/lookup", error);
    return NextResponse.json({ error: "Failed to lookup sale" }, { status: 500 });
  }
}
