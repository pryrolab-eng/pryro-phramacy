import { prisma } from "@/lib/db/prisma";

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
  input: BranchTransferInput,
): Promise<BranchTransferResult> {
  const { pharmacyId, inventoryId, fromBranchId, toBranchId, quantity } = input;

  if (fromBranchId === toBranchId) {
    throw new Error("Source and destination branch must be different");
  }
  if (quantity <= 0) {
    throw new Error("Quantity must be greater than zero");
  }

  return prisma.$transaction(async (tx) => {
    const source = await tx.inventory.findFirst({
      where: {
        id: inventoryId,
        pharmacy_id: pharmacyId,
        branch_id: fromBranchId,
      },
      include: { medications: { select: { name: true } } },
    });

    if (!source) {
      throw new Error("Product not found at the source branch");
    }

    const sourceQty = Number(source.quantity_in_stock ?? 0);
    if (sourceQty < quantity) {
      throw new Error(
        `Insufficient stock at source branch. Available: ${sourceQty}`,
      );
    }

    const medicationName = source.medications?.name ?? "Product";
    const newSourceQty = sourceQty - quantity;

    await tx.inventory.update({
      where: { id: source.id },
      data: { quantity_in_stock: newSourceQty, updated_at: new Date() },
    });

    const destRow = await tx.inventory.findFirst({
      where: {
        pharmacy_id: pharmacyId,
        branch_id: toBranchId,
        medication_id: source.medication_id,
        batch_number: source.batch_number,
      },
      select: { id: true, quantity_in_stock: true },
    });

    let destinationStock: number;

    if (destRow) {
      destinationStock = Number(destRow.quantity_in_stock ?? 0) + quantity;
      await tx.inventory.update({
        where: { id: destRow.id },
        data: { quantity_in_stock: destinationStock, updated_at: new Date() },
      });
    } else {
      destinationStock = quantity;
      await tx.inventory.create({
        data: {
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
        },
      });
    }

    const transfer = await tx.inventory_transfers.create({
      data: {
        pharmacy_id: pharmacyId,
        medication_name: medicationName,
        quantity,
        from_branch_id: fromBranchId,
        to_branch_id: toBranchId,
        status: "completed",
        completed_at: new Date(),
      },
      select: { id: true },
    });

    return {
      transferId: transfer.id,
      sourceStock: newSourceQty,
      destinationStock,
    };
  });
}
