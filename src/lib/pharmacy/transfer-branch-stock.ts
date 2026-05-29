import type { SupabaseClient } from "@supabase/supabase-js";

export type BranchTransferInput = {
  pharmacyId: string;
  inventoryId: string;
  fromBranchId: string;
  toBranchId: string;
  quantity: number;
};

export type BranchTransferResult = {
  transferId: string;
  sourceStock: number;
  destinationStock: number;
};

export async function transferBranchStock(
  admin: SupabaseClient,
  input: BranchTransferInput,
): Promise<BranchTransferResult> {
  const { pharmacyId, inventoryId, fromBranchId, toBranchId, quantity } = input;

  if (fromBranchId === toBranchId) {
    throw new Error("Source and destination branch must be different");
  }
  if (quantity <= 0) {
    throw new Error("Quantity must be greater than zero");
  }

  const { data: source, error: sourceErr } = await admin
    .from("inventory")
    .select(
      "id, pharmacy_id, branch_id, medication_id, batch_number, quantity_in_stock, unit_cost, selling_price, minimum_stock_level, expiry_date, manufacturing_date, supplier_id, medications(name)",
    )
    .eq("id", inventoryId)
    .eq("pharmacy_id", pharmacyId)
    .eq("branch_id", fromBranchId)
    .maybeSingle();

  if (sourceErr) throw new Error(sourceErr.message);
  if (!source) {
    throw new Error("Product not found at the source branch");
  }
  if (source.quantity_in_stock < quantity) {
    throw new Error(
      `Insufficient stock at source branch. Available: ${source.quantity_in_stock}`,
    );
  }

  const med = source.medications as { name?: string } | { name?: string }[] | null;
  const medicationName = Array.isArray(med) ? med[0]?.name : med?.name;

  const newSourceQty = source.quantity_in_stock - quantity;
  const { error: deductErr } = await admin
    .from("inventory")
    .update({ quantity_in_stock: newSourceQty })
    .eq("id", source.id);

  if (deductErr) throw new Error(deductErr.message);

  const { data: destRow } = await admin
    .from("inventory")
    .select("id, quantity_in_stock")
    .eq("pharmacy_id", pharmacyId)
    .eq("branch_id", toBranchId)
    .eq("medication_id", source.medication_id)
    .eq("batch_number", source.batch_number)
    .maybeSingle();

  let destinationStock: number;

  if (destRow) {
    destinationStock = destRow.quantity_in_stock + quantity;
    const { error: addErr } = await admin
      .from("inventory")
      .update({ quantity_in_stock: destinationStock })
      .eq("id", destRow.id);
    if (addErr) throw new Error(addErr.message);
  } else {
    destinationStock = quantity;
    const { error: insertErr } = await admin.from("inventory").insert({
      pharmacy_id: pharmacyId,
      branch_id: toBranchId,
      medication_id: source.medication_id,
      supplier_id: source.supplier_id,
      batch_number: source.batch_number,
      quantity_in_stock: quantity,
      unit_cost: source.unit_cost,
      selling_price: source.selling_price,
      minimum_stock_level: source.minimum_stock_level,
      expiry_date: source.expiry_date,
      manufacturing_date: source.manufacturing_date,
    });
    if (insertErr) throw new Error(insertErr.message);
  }

  const { data: transfer, error: transferErr } = await admin
    .from("inventory_transfers")
    .insert({
      pharmacy_id: pharmacyId,
      medication_name: medicationName ?? "Product",
      quantity,
      from_branch_id: fromBranchId,
      to_branch_id: toBranchId,
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (transferErr) throw new Error(transferErr.message);

  return {
    transferId: transfer.id,
    sourceStock: newSourceQty,
    destinationStock,
  };
}
