import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import {
  guardPharmacyFeatureForUser,
  handleEntitlementRouteError,
} from "@/lib/subscription/api-guard";
import {
  defaultDispositionForReason,
  isDispositionAllowed,
  stockMovementTypeForDisposition,
  type ReturnDisposition,
} from "@/lib/pos/return-disposition";
import {
  SHIFT_REQUIRED_CODE,
  SHIFT_REQUIRED_MESSAGE,
} from "@/lib/pos/cashier-shift";
import { storeFetchOpenCashierShift } from "@/lib/db/cashier-shifts-store";
import {
  mapReturnTypeToDb,
  storeGetSaleForReturn,
  storeProcessPosReturn,
  storeSumReturnedBySaleItemIds,
} from "@/lib/db/pos-store";

type ReturnLinePayload = {
  saleItemId: string;
  inventoryId: string;
  quantity: number;
  disposition: ReturnDisposition;
};

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const saleId = body.saleId as string | undefined;
    const branchId = body.branchId as string | undefined;
    const reason = (body.reason as string) || "other";
    const returnType = (body.returnType as string) || "return";
    const notes = (body.notes as string) || null;
    const refundAmount = Number(body.refundAmount) || 0;
    const refundMethod = (body.refundMethod as string) || null;
    const items = (body.items as ReturnLinePayload[]) ?? [];

    if (!saleId || !branchId) {
      return NextResponse.json(
        { error: "saleId and branchId are required" },
        { status: 400 },
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: "At least one return line is required" },
        { status: 400 },
      );
    }

    const { pharmacyId } = await guardPharmacyFeatureForUser(user.id, {
      feature: "pos.returns",
      branchId,
    });

    const openShift = await storeFetchOpenCashierShift(user.id, branchId);
    if (!openShift) {
      return NextResponse.json(
        { error: SHIFT_REQUIRED_MESSAGE, code: SHIFT_REQUIRED_CODE },
        { status: 403 },
      );
    }

    const sale = await storeGetSaleForReturn(saleId);
    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    if (sale.pharmacy_id !== pharmacyId || sale.branch_id !== branchId) {
      return NextResponse.json(
        { error: "Sale does not belong to this branch" },
        { status: 400 },
      );
    }

    if (sale.status !== "completed") {
      return NextResponse.json(
        { error: "Only completed sales can be returned" },
        { status: 400 },
      );
    }

    const saleItemMap = new Map(sale.sale_items.map((i) => [i.id, i]));
    const saleItemIds = items.map((i) => i.saleItemId);
    const returnedQty = await storeSumReturnedBySaleItemIds(saleItemIds);

    let computedRefund = 0;

    for (const line of items) {
      const sold = saleItemMap.get(line.saleItemId);
      if (!sold) {
        return NextResponse.json(
          { error: `Invalid sale line: ${line.saleItemId}` },
          { status: 400 },
        );
      }

      const available = sold.quantity - (returnedQty[line.saleItemId] ?? 0);
      if (line.quantity <= 0 || line.quantity > available) {
        return NextResponse.json(
          {
            error: `Invalid quantity for ${sold.medication_name}. Max returnable: ${available}`,
          },
          { status: 400 },
        );
      }

      const disposition =
        line.disposition ?? defaultDispositionForReason(reason);

      if (!isDispositionAllowed(reason, disposition)) {
        return NextResponse.json(
          {
            error: `Cannot restock ${sold.medication_name} for reason "${reason}". Use damaged or destroy.`,
          },
          { status: 400 },
        );
      }

      if (sold.inventory_id && line.inventoryId !== sold.inventory_id) {
        return NextResponse.json(
          { error: `Inventory mismatch for ${sold.medication_name}` },
          { status: 400 },
        );
      }

      computedRefund += line.quantity * Number(sold.unit_price);
    }

    const finalRefund = refundAmount > 0 ? refundAmount : computedRefund;

    const returnRecord = await storeProcessPosReturn({
      pharmacyId,
      branchId,
      saleId,
      processedBy: user.id,
      shiftId: openShift.id,
      shiftTotalRefunds: Number(openShift.total_refunds ?? 0) + finalRefund,
      reason,
      returnType: mapReturnTypeToDb(returnType),
      notes,
      refundAmount: finalRefund,
      refundMethod,
      lines: items.map((line) => {
        const sold = saleItemMap.get(line.saleItemId)!;
        const disposition =
          line.disposition ?? defaultDispositionForReason(reason);
        return {
          saleItemId: line.saleItemId,
          inventoryId: line.inventoryId,
          quantity: line.quantity,
          disposition,
          medicationName: sold.medication_name,
          unitPrice: Number(sold.unit_price),
          batchNumber: sold.batch_number,
          expiryDate: sold.expiry_date,
          inventoryIdOnSale: sold.inventory_id,
          movementType: stockMovementTypeForDisposition(disposition),
          restock: disposition === "restock",
        };
      }),
    });

    return NextResponse.json({
      success: true,
      return: returnRecord,
      refundAmount: finalRefund,
    });
  } catch (error) {
    const entitlement = handleEntitlementRouteError(error);
    if (entitlement) return entitlement;
    console.error("POST /api/pos/returns", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process return",
      },
      { status: 500 },
    );
  }
}
