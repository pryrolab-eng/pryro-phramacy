import type { medication_category, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type InventoryMedicationSummary = {
  name: string;
  category: string;
  pharmacy_id: string | null;
};

export type InventoryListRow = {
  id: string;
  pharmacy_id: string | null;
  branch_id: string | null;
  medication_id: string | null;
  batch_number: string;
  quantity_in_stock: number | null;
  selling_price: number | null;
  minimum_stock_level: number | null;
  expiry_date: Date | null;
  unit_cost: number | null;
  medications: InventoryMedicationSummary | null;
};

function decimalToNumber(value: Prisma.Decimal | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

function mapInventoryRow(row: {
  id: string;
  pharmacy_id: string | null;
  branch_id: string | null;
  medication_id: string | null;
  batch_number: string;
  quantity_in_stock: number | null;
  selling_price: Prisma.Decimal | null;
  minimum_stock_level: number | null;
  expiry_date: Date | null;
  unit_cost: Prisma.Decimal | null;
  medications: {
    name: string;
    category: medication_category | null;
    pharmacy_id: string | null;
  } | null;
}): InventoryListRow {
  return {
    id: row.id,
    pharmacy_id: row.pharmacy_id,
    branch_id: row.branch_id,
    medication_id: row.medication_id,
    batch_number: row.batch_number,
    quantity_in_stock: row.quantity_in_stock,
    selling_price: decimalToNumber(row.selling_price),
    minimum_stock_level: row.minimum_stock_level,
    expiry_date: row.expiry_date,
    unit_cost: decimalToNumber(row.unit_cost),
    medications: row.medications
      ? {
          name: row.medications.name,
          category: row.medications.category ?? "otc",
          pharmacy_id: row.medications.pharmacy_id,
        }
      : null,
  };
}

export async function listInventoryForPharmacy(
  pharmacyId: string,
  branchId?: string | null,
): Promise<InventoryListRow[]> {
  const rows = await prisma.inventory.findMany({
    where: {
      pharmacy_id: pharmacyId,
      ...(branchId ? { branch_id: branchId } : {}),
      medications: { pharmacy_id: pharmacyId },
    },
    select: {
      id: true,
      pharmacy_id: true,
      branch_id: true,
      medication_id: true,
      batch_number: true,
      quantity_in_stock: true,
      selling_price: true,
      minimum_stock_level: true,
      expiry_date: true,
      unit_cost: true,
      medications: {
        select: { name: true, category: true, pharmacy_id: true },
      },
    },
  });

  return rows.map(mapInventoryRow);
}

export async function listInventoryAlertsForPharmacy(
  pharmacyId: string,
): Promise<InventoryListRow[]> {
  const rows = await prisma.inventory.findMany({
    where: { pharmacy_id: pharmacyId },
    select: {
      id: true,
      pharmacy_id: true,
      branch_id: true,
      medication_id: true,
      batch_number: true,
      quantity_in_stock: true,
      selling_price: true,
      minimum_stock_level: true,
      expiry_date: true,
      unit_cost: true,
      medications: {
        select: { name: true, category: true, pharmacy_id: true },
      },
    },
  });

  return rows.map(mapInventoryRow);
}

export async function findMedicationByName(
  pharmacyId: string,
  name: string,
): Promise<{ id: string } | null> {
  const row = await prisma.medications.findFirst({
    where: { pharmacy_id: pharmacyId, name },
    select: { id: true },
  });
  return row;
}

export async function createMedication(input: {
  pharmacyId: string;
  name: string;
  category: medication_category;
  requiresPrescription: boolean;
}): Promise<{ id: string }> {
  const row = await prisma.medications.create({
    data: {
      pharmacy_id: input.pharmacyId,
      name: input.name,
      category: input.category,
      requires_prescription: input.requiresPrescription,
      is_active: true,
    },
    select: { id: true },
  });
  return row;
}

export async function findInventoryByMedicationBranch(input: {
  pharmacyId: string;
  branchId: string;
  medicationId: string;
}): Promise<{ id: string; quantity_in_stock: number | null } | null> {
  const row = await prisma.inventory.findFirst({
    where: {
      pharmacy_id: input.pharmacyId,
      branch_id: input.branchId,
      medication_id: input.medicationId,
    },
    select: { id: true, quantity_in_stock: true },
  });
  return row;
}

export async function createInventoryRow(input: {
  pharmacyId: string;
  branchId: string;
  medicationId: string;
  batchNumber: string;
  quantityInStock: number;
  unitCost: number;
  sellingPrice: number;
  minimumStockLevel: number;
  expiryDate: string | Date;
}): Promise<Record<string, unknown>> {
  const row = await prisma.inventory.create({
    data: {
      pharmacy_id: input.pharmacyId,
      branch_id: input.branchId,
      medication_id: input.medicationId,
      batch_number: input.batchNumber,
      quantity_in_stock: input.quantityInStock,
      unit_cost: input.unitCost,
      selling_price: input.sellingPrice,
      minimum_stock_level: input.minimumStockLevel,
      expiry_date: new Date(input.expiryDate),
    },
  });
  return row as unknown as Record<string, unknown>;
}

export async function updateInventoryQuantity(
  id: string,
  quantityInStock: number,
): Promise<void> {
  await prisma.inventory.update({
    where: { id },
    data: { quantity_in_stock: quantityInStock },
  });
}

export async function updateInventoryItem(
  id: string,
  data: {
    quantity_in_stock?: number;
    selling_price?: number;
    minimum_stock_level?: number;
    unit_cost?: number;
  },
): Promise<void> {
  await prisma.inventory.update({
    where: { id },
    data: {
      ...(data.quantity_in_stock !== undefined
        ? { quantity_in_stock: data.quantity_in_stock }
        : {}),
      ...(data.selling_price !== undefined
        ? { selling_price: data.selling_price }
        : {}),
      ...(data.minimum_stock_level !== undefined
        ? { minimum_stock_level: data.minimum_stock_level }
        : {}),
      ...(data.unit_cost !== undefined ? { unit_cost: data.unit_cost } : {}),
    },
  });
}

export async function getInventoryQuantity(
  id: string,
): Promise<number | null> {
  const row = await prisma.inventory.findUnique({
    where: { id },
    select: { quantity_in_stock: true },
  });
  return row?.quantity_in_stock ?? null;
}

export async function deleteInventoryItem(id: string): Promise<void> {
  await prisma.inventory.delete({ where: { id } });
}

export type InventoryTransferRow = {
  id: string;
  medication_name: string;
  quantity: number;
  from_branch_id: string | null;
  to_branch_id: string | null;
  status: string | null;
  created_at: Date | null;
};

export async function listInventoryTransfersForPharmacy(
  pharmacyId: string,
  limit = 100,
): Promise<InventoryTransferRow[]> {
  return prisma.inventory_transfers.findMany({
    where: { pharmacy_id: pharmacyId },
    orderBy: { created_at: "desc" },
    take: limit,
    select: {
      id: true,
      medication_name: true,
      quantity: true,
      from_branch_id: true,
      to_branch_id: true,
      status: true,
      created_at: true,
    },
  });
}

export type SupplierRow = {
  id: string;
  pharmacy_id: string | null;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean | null;
  created_at: Date | null;
};

export async function listActiveSuppliersFromDb(): Promise<SupplierRow[]> {
  return prisma.suppliers.findMany({
    where: { is_active: true },
    orderBy: { created_at: "desc" },
  });
}

export async function createSupplierFromDb(input: {
  pharmacyId: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}): Promise<SupplierRow> {
  return prisma.suppliers.create({
    data: {
      pharmacy_id: input.pharmacyId,
      name: input.name,
      contact_person: input.contactPerson || null,
      phone: input.phone || null,
      email: input.email || null,
      is_active: true,
    },
  });
}
