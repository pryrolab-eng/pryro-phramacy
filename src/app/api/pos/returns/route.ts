import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";
import {
  guardPharmacyFeature,
  handleEntitlementRouteError,
} from "@/lib/subscription/api-guard";
import {
  defaultDispositionForReason,
  isDispositionAllowed,
  stockMovementTypeForDisposition,
  type ReturnDisposition,
} from "@/lib/pos/return-disposition";
import {
  fetchOpenCashierShift,
  SHIFT_REQUIRED_CODE,
  SHIFT_REQUIRED_MESSAGE,
} from "@/lib/pos/cashier-shift";

type ReturnLinePayload = {
  saleItemId: string;
  inventoryId: string;
  quantity: number;
  disposition: ReturnDisposition;
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    const { pharmacyId } = await guardPharmacyFeature(supabase, user.id, {
      feature: "pos.returns",
      branchId,
    });

    const openShift = await fetchOpenCashierShift(supabase, user.id, branchId);
    if (!openShift) {
      return NextResponse.json(
        { error: SHIFT_REQUIRED_MESSAGE, code: SHIFT_REQUIRED_CODE },
        { status: 403 },
      );
    }

    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .select(
        `
        id,
        pharmacy_id,
        branch_id,
        status,
        sale_items (
          id,
          inventory_id,
          medication_name,
          quantity,
          unit_price,
          batch_number,
          expiry_date
        )
      `,
      )
      .eq("id", saleId)
      .single();

    if (saleError || !sale) {
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

    const saleItems = (sale.sale_items ?? []) as Array<{
      id: string;
      inventory_id: string | null;
      medication_name: string;
      quantity: number;
      unit_price: number;
      batch_number: string | null;
      expiry_date: string | null;
    }>;

    const saleItemMap = new Map(saleItems.map((i) => [i.id, i]));

    const saleItemIds = items.map((i) => i.saleItemId);
    const { data: priorReturns } = await supabase
      .from("return_items")
      .select("sale_item_id, quantity")
      .in("sale_item_id", saleItemIds);

    const returnedQty: Record<string, number> = {};
    for (const row of priorReturns ?? []) {
      const sid = row.sale_item_id as string;
      returnedQty[sid] = (returnedQty[sid] ?? 0) + Number(row.quantity ?? 0);
    }

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

    const finalRefund =
      refundAmount > 0 ? refundAmount : computedRefund;

    const { data: returnRecord, error: returnError } = await supabase
      .from("returns")
      .insert({
        pharmacy_id: pharmacyId,
        branch_id: branchId,
        sale_id: saleId,
        reason,
        return_type: returnType,
        notes,
        refund_amount: finalRefund,
        refund_method: refundMethod,
        status: "processed",
        processed_by: user.id,
      })
      .select()
      .single();

    if (returnError) throw returnError;

    for (const line of items) {
      const sold = saleItemMap.get(line.saleItemId)!;
      const disposition =
        line.disposition ?? defaultDispositionForReason(reason);
      const unitPrice = Number(sold.unit_price);
      const lineTotal = line.quantity * unitPrice;

      const { error: itemError } = await supabase.from("return_items").insert({
        return_id: returnRecord.id,
        sale_item_id: line.saleItemId,
        inventory_id: sold.inventory_id,
        medication_name: sold.medication_name,
        quantity: line.quantity,
        unit_price: unitPrice,
        total_price: lineTotal,
        disposition,
        batch_number: sold.batch_number,
        expiry_date: sold.expiry_date,
      });

      if (itemError) throw itemError;

      if (!sold.inventory_id) continue;

      const movementType = stockMovementTypeForDisposition(disposition);
      const movementNotes = `Return ${returnRecord.id} · ${reason} · ${disposition}`;

      if (disposition === "restock") {
        const { data: inv } = await supabase
          .from("inventory")
          .select("quantity_in_stock, branch_id, pharmacy_id")
          .eq("id", sold.inventory_id)
          .single();

        if (
          inv &&
          inv.pharmacy_id === pharmacyId &&
          inv.branch_id === branchId
        ) {
          await supabase
            .from("inventory")
            .update({
              quantity_in_stock: inv.quantity_in_stock + line.quantity,
            })
            .eq("id", sold.inventory_id);

          await supabase.from("stock_movements").insert({
            pharmacy_id: pharmacyId,
            inventory_id: sold.inventory_id,
            movement_type: movementType,
            quantity: line.quantity,
            reference_id: returnRecord.id,
            reference_type: "return",
            notes: movementNotes,
            created_by: user.id,
          });
        }
      } else {
        await supabase.from("stock_movements").insert({
          pharmacy_id: pharmacyId,
          inventory_id: sold.inventory_id,
          movement_type: movementType,
          quantity: line.quantity,
          reference_id: returnRecord.id,
          reference_type: "return",
          notes: `${movementNotes} (not restocked)`,
          created_by: user.id,
        });
      }
    }

    await supabase
      .from("cashier_shifts")
      .update({
        total_refunds: Number(openShift.total_refunds ?? 0) + finalRefund,
      })
      .eq("id", openShift.id);

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
