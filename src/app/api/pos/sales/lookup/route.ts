import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../../supabase/server";
import {
  guardPharmacyFeature,
  handleEntitlementRouteError,
} from "@/lib/subscription/api-guard";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    const { pharmacyId } = await guardPharmacyFeature(supabase, user.id, {
      feature: "pos.returns",
      branchId: branchId ?? undefined,
    });

    let query = supabase
      .from("sales")
      .select(
        `
        id,
        receipt_number,
        customer_name,
        customer_phone,
        total_amount,
        payment_method,
        status,
        branch_id,
        created_at,
        sale_items (
          id,
          inventory_id,
          medication_name,
          quantity,
          unit_price,
          total_price,
          batch_number,
          expiry_date
        )
      `,
      )
      .eq("pharmacy_id", pharmacyId)
      .eq("status", "completed");

    if (saleId) {
      query = query.eq("id", saleId);
    } else if (receipt) {
      query = query.ilike("receipt_number", receipt);
    }

    if (branchId) {
      query = query.eq("branch_id", branchId);
    }

    const { data: sales, error } = await query.limit(5);

    if (error) throw error;

    if (!sales?.length) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    const sale = sales[0];
    const items = (sale.sale_items ?? []) as Array<{
      id: string;
      inventory_id: string | null;
      medication_name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      batch_number: string | null;
      expiry_date: string | null;
    }>;

    const returnedBySaleItem: Record<string, number> = {};

    const { data: returnsForSale } = await supabase
      .from("returns")
      .select("id")
      .eq("sale_id", sale.id);

    const returnIds = (returnsForSale ?? []).map((r) => r.id);

    if (returnIds.length > 0) {
      const { data: priorItems } = await supabase
        .from("return_items")
        .select("sale_item_id, quantity")
        .in("return_id", returnIds);

      for (const row of priorItems ?? []) {
        const sid = row.sale_item_id as string;
        if (!sid) continue;
        returnedBySaleItem[sid] =
          (returnedBySaleItem[sid] ?? 0) + Number(row.quantity ?? 0);
      }
    }

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
          expiryDate: item.expiry_date,
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
