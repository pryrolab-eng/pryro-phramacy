import type {
  payment_method,
  Prisma,
  return_disposition,
  return_type,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  isMissingStockLocationColumn,
  posMedicationWithCategorySelect,
  resolveStockLocationId,
} from "@/lib/db/inventory";
import {
  medicationCategoryDisplayName,
  medicationCategoryWriteData,
  resolveMedicationCategoryRef,
} from "@/lib/db/medication-category-ref";

export type PosProductRow = {
  id: string;
  medication_id: string | null;
  batch_number: string;
  quantity_in_stock: number | null;
  selling_price: number | null;
  expiry_date: Date | null;
  medications: {
    id: string;
    name: string;
    category: string | null;
    generic_name: string | null;
    strength: string | null;
    dosage_form: string | null;
    barcode: string | null;
    requires_prescription: boolean | null;
  } | null;
};

export type SaleInventoryRow = {
  id: string;
  pharmacy_id: string | null;
  branch_id: string | null;
  batch_number: string;
  quantity_in_stock: number | null;
  expiry_date: Date | null;
  medication_id: string | null;
  medications: {
    id: string;
    name: string;
    requires_prescription: boolean | null;
  } | null;
};

function decimalToNumber(value: Prisma.Decimal | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

function mapPosProduct(row: {
  id: string;
  medication_id: string | null;
  batch_number: string;
  quantity_in_stock: number | null;
  selling_price: Prisma.Decimal | null;
  expiry_date: Date | null;
  medications: {
    id: string;
    name: string;
    category: string | null;
    generic_name: string | null;
    strength: string | null;
    dosage_form: string | null;
    barcode: string | null;
    requires_prescription: boolean | null;
    categories: { name: string } | null;
    global_categories: { name: string } | null;
  } | null;
}): PosProductRow {
  return {
    id: row.id,
    medication_id: row.medication_id,
    batch_number: row.batch_number,
    quantity_in_stock: row.quantity_in_stock,
    selling_price: decimalToNumber(row.selling_price),
    expiry_date: row.expiry_date,
    medications: row.medications
      ? {
          id: row.medications.id,
          name: row.medications.name,
          category: medicationCategoryDisplayName(row.medications),
          generic_name: row.medications.generic_name,
          strength: row.medications.strength,
          dosage_form: row.medications.dosage_form,
          barcode: row.medications.barcode,
          requires_prescription: row.medications.requires_prescription,
        }
      : null,
  };
}

export async function listPosSellableProducts(
  pharmacyId: string,
  branchId: string,
): Promise<PosProductRow[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows = await prisma.inventory.findMany({
    where: {
      pharmacy_id: pharmacyId,
      branch_id: branchId,
      quantity_in_stock: { gt: 0 },
      OR: [{ expiry_date: null }, { expiry_date: { gte: today } }],
    },
    select: {
      id: true,
      medication_id: true,
      batch_number: true,
      quantity_in_stock: true,
      selling_price: true,
      expiry_date: true,
      medications: {
        select: posMedicationWithCategorySelect,
      },
    },
  });

  return rows.map(mapPosProduct);
}

export async function getInventoryRowsForSale(
  ids: string[],
): Promise<SaleInventoryRow[]> {
  const rows = await prisma.inventory.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      pharmacy_id: true,
      branch_id: true,
      batch_number: true,
      quantity_in_stock: true,
      expiry_date: true,
      medication_id: true,
      medications: {
        select: { id: true, name: true, requires_prescription: true },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    pharmacy_id: row.pharmacy_id,
    branch_id: row.branch_id,
    batch_number: row.batch_number,
    quantity_in_stock: row.quantity_in_stock,
    expiry_date: row.expiry_date,
    medication_id: row.medication_id,
    medications: row.medications,
  }));
}

export type CreatePosSaleInput = {
  pharmacyId: string;
  branchId: string;
  cashierId: string;
  shiftId: string;
  customerId?: string | null;
  customerName: string;
  customerPhone: string | null;
  patientName?: string | null;
  insuranceProviderId: string | null;
  subtotal: number;
  insuranceAmount: number;
  customerAmount: number;
  paymentMethod: payment_method;
  receiptNumber: string;
  notes: string | null;
  items: Array<{
    inventoryId: string;
    medicationName: string;
    quantity: number;
    unitPrice: number;
    batchNumber?: string | null;
    expiryDate?: string | null;
  }>;
  stockMovements: Array<{
    inventoryId: string;
    quantity: number;
  }>;
  shiftSaleTotal: number;
  shiftTransactionCount: number;
};

export async function createPosSale(
  input: CreatePosSaleInput,
): Promise<{
  sale: Record<string, unknown>;
  saleItemIdByInventoryId: Map<string, string>;
}> {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sales.create({
      data: {
        pharmacy_id: input.pharmacyId,
        branch_id: input.branchId,
        cashier_id: input.cashierId,
        shift_id: input.shiftId,
        customer_id: input.customerId ?? null,
        customer_name: input.customerName,
        customer_phone: input.customerPhone,
        patient_name: input.patientName ?? null,
        insurance_provider_id: input.insuranceProviderId,
        subtotal: input.subtotal,
        insurance_amount: input.insuranceAmount,
        customer_amount: input.customerAmount,
        total_amount: input.subtotal,
        payment_method: input.paymentMethod,
        status: "completed",
        receipt_number: input.receiptNumber,
        notes: input.notes,
      },
    });

    const insertedItems = await Promise.all(
      input.items.map((item) =>
        tx.sale_items.create({
          data: {
            sale_id: sale.id,
            inventory_id: item.inventoryId,
            medication_name: item.medicationName,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.quantity * item.unitPrice,
            batch_number: item.batchNumber ?? null,
            expiry_date: item.expiryDate ? new Date(item.expiryDate) : null,
          },
          select: { id: true, inventory_id: true },
        }),
      ),
    );

    const saleItemIdByInventoryId = new Map<string, string>();
    for (const row of insertedItems) {
      if (row.inventory_id) {
        saleItemIdByInventoryId.set(row.inventory_id, row.id);
      }
    }

    for (const item of input.items) {
      const inv = await tx.inventory.findUnique({
        where: { id: item.inventoryId },
        select: { quantity_in_stock: true },
      });
      if (!inv) continue;
      const newQty = Math.max(0, (inv.quantity_in_stock ?? 0) - item.quantity);
      await tx.inventory.update({
        where: { id: item.inventoryId },
        data: { quantity_in_stock: newQty },
      });
    }

    for (const movement of input.stockMovements) {
      await tx.stock_movements.create({
        data: {
          pharmacy_id: input.pharmacyId,
          inventory_id: movement.inventoryId,
          movement_type: "out",
          quantity: movement.quantity,
          reference_id: sale.id,
          reference_type: "sale",
          notes: `POS sale ${input.receiptNumber}`,
          created_by: input.cashierId,
        },
      });
    }

    await tx.cashier_shifts.update({
      where: { id: input.shiftId },
      data: {
        total_sales: input.shiftSaleTotal,
        transaction_count: input.shiftTransactionCount,
      },
    });

    return {
      sale: sale as unknown as Record<string, unknown>,
      saleItemIdByInventoryId,
    };
  });
}

export async function quickAddPosDrug(input: {
  pharmacyId: string;
  branchId: string;
  name: string;
  category: string;
  manufacturer: string | null;
  barcode: string | null;
  batchNumber: string;
  quantityInStock: number;
  unitCost: number;
  sellingPrice: number;
  minimumStockLevel: number;
  expiryDate: string | null;
  stockLocation?: string | null;
}): Promise<{ medication: Record<string, unknown>; inventory: Record<string, unknown> }> {
  const stockLocationId = await resolveStockLocationId({
    pharmacyId: input.pharmacyId,
    value: input.stockLocation,
  });

  const categoryRef = await resolveMedicationCategoryRef(input.pharmacyId, input.category, {
    createIfMissing: true,
  });
  const categoryData = medicationCategoryWriteData(categoryRef);

  const medication = await prisma.medications.create({
    data: {
      pharmacy_id: input.pharmacyId,
      name: input.name,
      category: categoryData.category,
      category_id: categoryData.category_id,
      global_category_id: categoryData.global_category_id,
      manufacturer: input.manufacturer,
      barcode: input.barcode,
      requires_prescription: categoryData.requires_prescription,
      is_active: true,
    },
  });

  const inventoryData = {
    pharmacy_id: input.pharmacyId,
    branch_id: input.branchId,
    medication_id: medication.id,
    batch_number: input.batchNumber,
    quantity_in_stock: input.quantityInStock,
    unit_cost: input.unitCost,
    selling_price: input.sellingPrice,
    minimum_stock_level: input.minimumStockLevel,
    expiry_date: input.expiryDate ? new Date(input.expiryDate) : null,
    ...(stockLocationId ? { stock_location_id: stockLocationId } : {}),
  };

  let inventory;
  try {
    inventory = await prisma.inventory.create({ data: inventoryData });
  } catch (error) {
    if (!stockLocationId || !isMissingStockLocationColumn(error)) {
      throw error;
    }
    inventory = await prisma.inventory.create({
      data: {
        pharmacy_id: input.pharmacyId,
        branch_id: input.branchId,
        medication_id: medication.id,
        batch_number: input.batchNumber,
        quantity_in_stock: input.quantityInStock,
        unit_cost: input.unitCost,
        selling_price: input.sellingPrice,
        minimum_stock_level: input.minimumStockLevel,
        expiry_date: input.expiryDate ? new Date(input.expiryDate) : null,
      },
    });
  }

  return {
    medication: medication as unknown as Record<string, unknown>,
    inventory: inventory as unknown as Record<string, unknown>,
  };
}

export async function lookupCompletedSale(input: {
  pharmacyId: string;
  saleId?: string;
  receipt?: string;
  branchId?: string;
}): Promise<{
  sale: Record<string, unknown>;
  items: Array<Record<string, unknown>>;
} | null> {
  const sale = await prisma.sales.findFirst({
    where: {
      pharmacy_id: input.pharmacyId,
      status: "completed",
      ...(input.saleId ? { id: input.saleId } : {}),
      ...(input.receipt
        ? { receipt_number: { equals: input.receipt, mode: "insensitive" } }
        : {}),
      ...(input.branchId ? { branch_id: input.branchId } : {}),
    },
    include: {
      sale_items: {
        select: {
          id: true,
          inventory_id: true,
          medication_name: true,
          quantity: true,
          unit_price: true,
          total_price: true,
          batch_number: true,
          expiry_date: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  if (!sale) return null;

  return {
    sale: sale as unknown as Record<string, unknown>,
    items: sale.sale_items as unknown as Array<Record<string, unknown>>,
  };
}

export async function sumReturnedQuantitiesBySaleItem(
  saleId: string,
): Promise<Record<string, number>> {
  const returns = await prisma.returns.findMany({
    where: { sale_id: saleId },
    select: { id: true },
  });

  if (returns.length === 0) return {};

  const returnItems = await prisma.return_items.findMany({
    where: { return_id: { in: returns.map((r) => r.id) } },
    select: { sale_item_id: true, quantity: true },
  });

  return aggregateReturnedBySaleItem(returnItems);
}

export async function sumReturnedQuantitiesBySaleItemIds(
  saleItemIds: string[],
): Promise<Record<string, number>> {
  if (saleItemIds.length === 0) return {};

  const returnItems = await prisma.return_items.findMany({
    where: { sale_item_id: { in: saleItemIds } },
    select: { sale_item_id: true, quantity: true },
  });

  return aggregateReturnedBySaleItem(returnItems);
}

function aggregateReturnedBySaleItem(
  rows: Array<{ sale_item_id: string | null; quantity: number | null }>,
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const row of rows) {
    const sid = row.sale_item_id;
    if (!sid) continue;
    totals[sid] = (totals[sid] ?? 0) + (row.quantity ?? 0);
  }
  return totals;
}

export type SaleForReturn = {
  id: string;
  pharmacy_id: string | null;
  branch_id: string | null;
  status: string | null;
  sale_items: Array<{
    id: string;
    inventory_id: string | null;
    medication_name: string;
    quantity: number;
    unit_price: number;
    batch_number: string | null;
    expiry_date: Date | null;
  }>;
};

export async function getSaleForReturn(
  saleId: string,
): Promise<SaleForReturn | null> {
  const sale = await prisma.sales.findUnique({
    where: { id: saleId },
    select: {
      id: true,
      pharmacy_id: true,
      branch_id: true,
      status: true,
      sale_items: {
        select: {
          id: true,
          inventory_id: true,
          medication_name: true,
          quantity: true,
          unit_price: true,
          batch_number: true,
          expiry_date: true,
        },
      },
    },
  });

  if (!sale) return null;

  return {
    id: sale.id,
    pharmacy_id: sale.pharmacy_id,
    branch_id: sale.branch_id,
    status: sale.status,
    sale_items: sale.sale_items.map((item) => ({
      id: item.id,
      inventory_id: item.inventory_id,
      medication_name: item.medication_name,
      quantity: item.quantity,
      unit_price: Number(item.unit_price),
      batch_number: item.batch_number,
      expiry_date: item.expiry_date,
    })),
  };
}

export type ProcessReturnLine = {
  saleItemId: string;
  inventoryId: string;
  quantity: number;
  disposition: return_disposition;
  medicationName: string;
  unitPrice: number;
  batchNumber: string | null;
  expiryDate: Date | null;
  inventoryIdOnSale: string | null;
  movementType: string;
  restock: boolean;
};

export type ProcessPosReturnInput = {
  pharmacyId: string;
  branchId: string;
  saleId: string;
  processedBy: string;
  shiftId: string;
  shiftTotalRefunds: number;
  reason: string;
  returnType: return_type;
  notes: string | null;
  refundAmount: number;
  refundMethod: string | null;
  lines: ProcessReturnLine[];
};

export async function processPosReturn(
  input: ProcessPosReturnInput,
): Promise<Record<string, unknown>> {
  return prisma.$transaction(async (tx) => {
    const returnRecord = await tx.returns.create({
      data: {
        pharmacy_id: input.pharmacyId,
        branch_id: input.branchId,
        sale_id: input.saleId,
        reason: input.reason,
        return_type: input.returnType,
        notes: input.notes,
        refund_amount: input.refundAmount,
        refund_method: input.refundMethod,
        status: "processed",
        processed_by: input.processedBy,
      },
    });

    for (const line of input.lines) {
      const movementNotes = `Return ${returnRecord.id} · ${input.reason} · ${line.disposition}`;

      await tx.return_items.create({
        data: {
          return_id: returnRecord.id,
          sale_item_id: line.saleItemId,
          inventory_id: line.inventoryIdOnSale,
          medication_name: line.medicationName,
          quantity: line.quantity,
          unit_price: line.unitPrice,
          total_price: line.quantity * line.unitPrice,
          disposition: line.disposition,
          batch_number: line.batchNumber,
          expiry_date: line.expiryDate,
        },
      });

      if (!line.inventoryIdOnSale) continue;

      if (line.restock) {
        const inv = await tx.inventory.findUnique({
          where: { id: line.inventoryIdOnSale },
          select: {
            quantity_in_stock: true,
            branch_id: true,
            pharmacy_id: true,
          },
        });

        if (
          inv &&
          inv.pharmacy_id === input.pharmacyId &&
          inv.branch_id === input.branchId
        ) {
          await tx.inventory.update({
            where: { id: line.inventoryIdOnSale },
            data: {
              quantity_in_stock: (inv.quantity_in_stock ?? 0) + line.quantity,
            },
          });

          await tx.stock_movements.create({
            data: {
              pharmacy_id: input.pharmacyId,
              inventory_id: line.inventoryIdOnSale,
              movement_type: line.movementType,
              quantity: line.quantity,
              reference_id: returnRecord.id,
              reference_type: "return",
              notes: movementNotes,
              created_by: input.processedBy,
            },
          });
        }
      } else {
        await tx.stock_movements.create({
          data: {
            pharmacy_id: input.pharmacyId,
            inventory_id: line.inventoryIdOnSale,
            movement_type: line.movementType,
            quantity: line.quantity,
            reference_id: returnRecord.id,
            reference_type: "return",
            notes: `${movementNotes} (not restocked)`,
            created_by: input.processedBy,
          },
        });
      }
    }

    await tx.cashier_shifts.update({
      where: { id: input.shiftId },
      data: { total_refunds: input.shiftTotalRefunds },
    });

    return returnRecord as unknown as Record<string, unknown>;
  });
}

export async function voidCompletedPosSale(input: {
  pharmacyId: string;
  saleId: string;
  reason: string;
  voidedBy: string;
}): Promise<Record<string, unknown> | null> {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sales.findFirst({
      where: {
        id: input.saleId,
        pharmacy_id: input.pharmacyId,
        status: "completed",
      },
      include: {
        sale_items: true,
        returns: { select: { id: true }, take: 1 },
      },
    });

    if (!sale) return null;
    if (sale.returns.length > 0) {
      throw new Error("Cannot void a sale that has returns");
    }

    const voidNote = `Voided: ${input.reason}`;
    const notes = [sale.notes, voidNote].filter(Boolean).join(" · ");

    await tx.sales.update({
      where: { id: sale.id },
      data: {
        status: "cancelled",
        notes,
        updated_at: new Date(),
      },
    });

    for (const item of sale.sale_items) {
      if (!item.inventory_id) continue;

      const inv = await tx.inventory.findUnique({
        where: { id: item.inventory_id },
        select: { quantity_in_stock: true },
      });

      await tx.inventory.update({
        where: { id: item.inventory_id },
        data: {
          quantity_in_stock: (inv?.quantity_in_stock ?? 0) + item.quantity,
        },
      });

      await tx.stock_movements.create({
        data: {
          pharmacy_id: input.pharmacyId,
          inventory_id: item.inventory_id,
          movement_type: "in",
          quantity: item.quantity,
          reference_id: sale.id,
          reference_type: "sale_void",
          notes: voidNote,
          created_by: input.voidedBy,
        },
      });
    }

    if (sale.shift_id) {
      const shift = await tx.cashier_shifts.findUnique({
        where: { id: sale.shift_id },
        select: { total_sales: true, transaction_count: true },
      });

      if (shift) {
        await tx.cashier_shifts.update({
          where: { id: sale.shift_id },
          data: {
            total_sales: Math.max(
              0,
              Number(shift.total_sales ?? 0) - Number(sale.total_amount ?? 0),
            ),
            transaction_count: Math.max(0, (shift.transaction_count ?? 0) - 1),
          },
        });
      }
    }

    return sale as unknown as Record<string, unknown>;
  });
}

export async function searchPosInventoryForPriceCheck(input: {
  pharmacyId: string;
  branchId?: string;
  query: string;
  limit?: number;
}): Promise<
  Array<{
    name: string;
    price: number;
    stock: number;
    barcode: string | null;
  }>
> {
  const q = input.query.trim();
  if (!q) return [];

  const rows = await prisma.inventory.findMany({
    where: {
      pharmacy_id: input.pharmacyId,
      ...(input.branchId ? { branch_id: input.branchId } : {}),
      quantity_in_stock: { gt: 0 },
      OR: [
        { medications: { name: { contains: q, mode: "insensitive" } } },
        { medications: { barcode: { contains: q, mode: "insensitive" } } },
        { batch_number: { contains: q, mode: "insensitive" } },
      ],
    },
    take: input.limit ?? 20,
    select: {
      quantity_in_stock: true,
      selling_price: true,
      medications: { select: { name: true, barcode: true } },
    },
  });

  return rows.map((row) => ({
    name: row.medications?.name ?? "Unknown",
    price: Number(row.selling_price ?? 0),
    stock: row.quantity_in_stock ?? 0,
    barcode: row.medications?.barcode ?? null,
  }));
}

export async function createHeldSaleFromDb(input: {
  pharmacyId: string;
  branchId?: string | null;
  cashierId: string;
  customer: unknown;
  cart: unknown;
}): Promise<Record<string, unknown>> {
  const row = await prisma.held_sales.create({
    data: {
      pharmacy_id: input.pharmacyId,
      branch_id: input.branchId ?? null,
      cashier_id: input.cashierId,
      customer: input.customer as import("@prisma/client").Prisma.InputJsonValue,
      cart: input.cart as import("@prisma/client").Prisma.InputJsonValue,
    },
  });
  return row as unknown as Record<string, unknown>;
}

export async function listHeldSalesFromDb(input: {
  pharmacyId: string;
  branchId?: string;
  cashierId?: string;
  limit?: number;
}): Promise<Array<Record<string, unknown>>> {
  const rows = await prisma.held_sales.findMany({
    where: {
      pharmacy_id: input.pharmacyId,
      ...(input.branchId ? { branch_id: input.branchId } : {}),
      ...(input.cashierId ? { cashier_id: input.cashierId } : {}),
    },
    orderBy: { created_at: "desc" },
    take: input.limit ?? 20,
  });
  return rows as unknown as Array<Record<string, unknown>>;
}
