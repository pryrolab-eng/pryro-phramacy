import { Prisma, type medication_category } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  medicationCategoryDisplayName,
  type MedicationCategoryRef,
  medicationCategoryWriteData,
} from "@/lib/db/medication-category-ref";

export type InventoryMedicationSummary = {
  name: string;
  category: string;
  pharmacy_id: string | null;
};

export const medicationWithCategorySelect = {
  id: true,
  name: true,
  category: true,
  pharmacy_id: true,
  categories: { select: { name: true } },
  global_categories: { select: { name: true } },
} as const;

export const posMedicationWithCategorySelect = {
  ...medicationWithCategorySelect,
  generic_name: true,
  strength: true,
  dosage_form: true,
  barcode: true,
  requires_prescription: true,
} as const;

type MedicationWithCategoryRow = {
  name: string;
  category: medication_category | null;
  pharmacy_id: string | null;
  categories: { name: string } | null;
  global_categories: { name: string } | null;
};

function mapMedicationSummary(
  med: MedicationWithCategoryRow,
): InventoryMedicationSummary {
  return {
    name: med.name,
    category: medicationCategoryDisplayName(med),
    pharmacy_id: med.pharmacy_id,
  };
}

export type InventoryListRow = {
  id: string;
  pharmacy_id: string | null;
  branch_id: string | null;
  medication_id: string | null;
  stock_location_id: string | null;
  batch_number: string;
  quantity_in_stock: number | null;
  selling_price: number | null;
  minimum_stock_level: number | null;
  expiry_date: Date | null;
  unit_cost: number | null;
  medications: InventoryMedicationSummary | null;
  stock_locations: { id: string; name: string } | null;
};

function decimalToNumber(value: Prisma.Decimal | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

export function isMissingStockLocationColumn(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2022" &&
    String(error.meta?.column ?? "").includes("stock_location_id")
  );
}

function mapInventoryRow(row: {
  id: string;
  pharmacy_id: string | null;
  branch_id: string | null;
  medication_id: string | null;
  stock_location_id: string | null;
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
    categories: { name: string } | null;
    global_categories: { name: string } | null;
  } | null;
  stock_locations: { id: string; name: string } | null;
}): InventoryListRow {
  return {
    id: row.id,
    pharmacy_id: row.pharmacy_id,
    branch_id: row.branch_id,
    medication_id: row.medication_id,
    stock_location_id: row.stock_location_id,
    batch_number: row.batch_number,
    quantity_in_stock: row.quantity_in_stock,
    selling_price: decimalToNumber(row.selling_price),
    minimum_stock_level: row.minimum_stock_level,
    expiry_date: row.expiry_date,
    unit_cost: decimalToNumber(row.unit_cost),
    medications: row.medications ? mapMedicationSummary(row.medications) : null,
    stock_locations: row.stock_locations,
  };
}

function mapInventoryRowWithoutStockLocation(row: {
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
  medications: MedicationWithCategoryRow | null;
}): InventoryListRow {
  return mapInventoryRow({
    ...row,
    stock_location_id: null,
    stock_locations: null,
  });
}

function slugifyLocation(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function resolveStockLocationId(input: {
  pharmacyId: string;
  value?: string | null;
}): Promise<string | null> {
  const raw = input.value?.trim();
  if (!raw) return null;

  const locations = await prisma.stock_locations.findMany({
    where: { pharmacy_id: input.pharmacyId, is_active: true },
    select: { id: true, name: true },
    orderBy: { created_at: "asc" },
  });
  if (locations.length === 0) return null;

  const byId = locations.find((location) => location.id === raw);
  if (byId) return byId.id;

  const wanted = slugifyLocation(raw);
  const bySlug = locations.find((location) => slugifyLocation(location.name) === wanted);
  return bySlug?.id ?? locations[0]?.id ?? null;
}

export async function listInventoryForPharmacy(
  pharmacyId: string,
  branchId?: string | null,
): Promise<InventoryListRow[]> {
  const where = {
    pharmacy_id: pharmacyId,
    ...(branchId ? { branch_id: branchId } : {}),
    medications: { pharmacy_id: pharmacyId },
  };

  try {
    const rows = await prisma.inventory.findMany({
      where,
      select: {
        id: true,
        pharmacy_id: true,
        branch_id: true,
        medication_id: true,
        stock_location_id: true,
        batch_number: true,
        quantity_in_stock: true,
        selling_price: true,
        minimum_stock_level: true,
        expiry_date: true,
        unit_cost: true,
        medications: {
          select: medicationWithCategorySelect,
        },
        stock_locations: { select: { id: true, name: true } },
      },
    });

    return rows.map(mapInventoryRow);
  } catch (error) {
    if (!isMissingStockLocationColumn(error)) throw error;
    const rows = await prisma.inventory.findMany({
      where,
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
          select: medicationWithCategorySelect,
        },
      },
    });
    return rows.map(mapInventoryRowWithoutStockLocation);
  }
}

export async function listInventoryAlertsForPharmacy(
  pharmacyId: string,
  branchId?: string | null,
): Promise<InventoryListRow[]> {
  const where = {
    pharmacy_id: pharmacyId,
    ...(branchId ? { branch_id: branchId } : {}),
  };

  try {
    const rows = await prisma.inventory.findMany({
      where,
      select: {
        id: true,
        pharmacy_id: true,
        branch_id: true,
        medication_id: true,
        stock_location_id: true,
        batch_number: true,
        quantity_in_stock: true,
        selling_price: true,
        minimum_stock_level: true,
        expiry_date: true,
        unit_cost: true,
        medications: {
          select: medicationWithCategorySelect,
        },
        stock_locations: { select: { id: true, name: true } },
      },
    });

    return rows.map(mapInventoryRow);
  } catch (error) {
    if (!isMissingStockLocationColumn(error)) throw error;
    const rows = await prisma.inventory.findMany({
      where,
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
          select: medicationWithCategorySelect,
        },
      },
    });
    return rows.map(mapInventoryRowWithoutStockLocation);
  }
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
  categoryRef: MedicationCategoryRef;
}): Promise<{ id: string }> {
  const categoryData = medicationCategoryWriteData(input.categoryRef);
  const row = await prisma.medications.create({
    data: {
      pharmacy_id: input.pharmacyId,
      name: input.name,
      category: categoryData.category,
      category_id: categoryData.category_id,
      global_category_id: categoryData.global_category_id,
      requires_prescription: categoryData.requires_prescription,
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
  stockLocationId?: string | null;
}): Promise<Record<string, unknown>> {
  const data = {
    pharmacy_id: input.pharmacyId,
    branch_id: input.branchId,
    medication_id: input.medicationId,
    batch_number: input.batchNumber,
    quantity_in_stock: input.quantityInStock,
    unit_cost: input.unitCost,
    selling_price: input.sellingPrice,
    minimum_stock_level: input.minimumStockLevel,
    expiry_date: new Date(input.expiryDate),
    ...(input.stockLocationId
      ? { stock_location_id: input.stockLocationId }
      : {}),
  };

  try {
    const row = await prisma.inventory.create({ data });
    return row as unknown as Record<string, unknown>;
  } catch (error) {
    if (!input.stockLocationId || !isMissingStockLocationColumn(error)) {
      throw error;
    }
  }

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
    stock_location_id?: string | null;
  },
): Promise<void> {
  const updateData = {
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
    ...(data.stock_location_id !== undefined
      ? { stock_location_id: data.stock_location_id }
      : {}),
  };

  try {
    await prisma.inventory.update({ where: { id }, data: updateData });
  } catch (error) {
    if (
      data.stock_location_id === undefined ||
      !isMissingStockLocationColumn(error)
    ) {
      throw error;
    }
    const { stock_location_id: _stockLocationId, ...withoutStockLocation } =
      updateData;
    if (Object.keys(withoutStockLocation).length > 0) {
      await prisma.inventory.update({
        where: { id },
        data: withoutStockLocation,
      });
    }
  }
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
