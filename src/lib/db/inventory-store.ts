import type { medication_category } from "@prisma/client";
import {
  createInventoryRow,
  createMedication,
  deleteInventoryItem,
  findInventoryByMedicationBranch,
  findMedicationByName,
  getInventoryQuantity,
  listInventoryAlertsForPharmacy,
  listInventoryForPharmacy,
  resolveStockLocationId,
  updateInventoryItem,
  updateInventoryQuantity,
  listInventoryTransfersForPharmacy,
  listActiveSuppliersFromDb,
  createSupplierFromDb,
  type InventoryListRow,
  type InventoryTransferRow,
  type SupplierRow,
} from "@/lib/db/inventory";

export type { InventoryListRow };

export type FormattedInventoryItem = {
  id: string;
  medicationId: string;
  name: string;
  category: string;
  stock: number | null;
  minStock: number | null;
  price: number | null;
  expiryDate: string | null;
  batchNumber: string;
  stockLocationId: string | null;
  stockLocationName: string | null;
  medications: InventoryListRow["medications"];
  pharmacy_id: string | null;
};

export function formatInventoryListItem(row: InventoryListRow): FormattedInventoryItem {
  return {
    id: row.id,
    medicationId: row.medication_id ?? "",
    name: row.medications?.name ?? "Unknown",
    category: row.medications?.category ?? "general",
    stock: row.quantity_in_stock,
    minStock: row.minimum_stock_level,
    price: row.selling_price,
    expiryDate: row.expiry_date
      ? row.expiry_date.toISOString().slice(0, 10)
      : null,
    batchNumber: row.batch_number,
    stockLocationId: row.stock_location_id,
    stockLocationName: row.stock_locations?.name ?? null,
    medications: row.medications,
    pharmacy_id: row.pharmacy_id,
  };
}

export async function storeListInventory(
  pharmacyId: string,
  branchId?: string | null,
): Promise<FormattedInventoryItem[]> {
  const rows = await listInventoryForPharmacy(pharmacyId, branchId);
  return rows.map(formatInventoryListItem);
}

export type StockAlertItem = {
  id: string;
  name: string;
  category: string;
  batch: string;
  quantity: number | null;
  minimum: number | null;
  expiry: string | null;
};

function formatAlertItem(row: InventoryListRow): StockAlertItem {
  return {
    id: row.id,
    name: row.medications?.name ?? "Unknown",
    category: row.medications?.category ?? "other",
    batch: row.batch_number,
    quantity: row.quantity_in_stock,
    minimum: row.minimum_stock_level,
    expiry: row.expiry_date ? row.expiry_date.toISOString().slice(0, 10) : null,
  };
}

export type ExpiryAlertItem = {
  id: string;
  product: string;
  batchNumber: string;
  expiryDate: string;
  daysUntilExpiry: number;
  quantity: number;
  priority: "high" | "medium" | "low";
};

export async function storeListExpiryAlerts(
  pharmacyId: string,
  withinDays = 60,
): Promise<ExpiryAlertItem[]> {
  const rows = await listInventoryAlertsForPharmacy(pharmacyId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + withinDays);

  return rows
    .filter((row) => row.expiry_date && row.expiry_date <= cutoff)
    .map((row) => {
      const expiry = row.expiry_date!;
      const daysUntilExpiry = Math.ceil(
        (expiry.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
      );
      let priority: ExpiryAlertItem["priority"] = "low";
      if (daysUntilExpiry <= 30) priority = "high";
      else if (daysUntilExpiry <= 60) priority = "medium";

      return {
        id: row.id,
        product: row.medications?.name ?? "Unknown",
        batchNumber: row.batch_number,
        expiryDate: expiry.toISOString().slice(0, 10),
        daysUntilExpiry,
        quantity: row.quantity_in_stock ?? 0,
        priority,
      };
    })
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
}

export async function storeStockAlerts(pharmacyId: string): Promise<{
  all: StockAlertItem[];
  lowStock: StockAlertItem[];
  expiring: StockAlertItem[];
}> {
  const rows = await listInventoryAlertsForPharmacy(pharmacyId);

  const lowStock = rows.filter(
    (item) =>
      (item.quantity_in_stock ?? 0) <= (item.minimum_stock_level ?? 0),
  );

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const expiring = rows.filter((item) => {
    if (!item.expiry_date) return false;
    return item.expiry_date <= thirtyDaysFromNow;
  });

  return {
    all: rows.map(formatAlertItem),
    lowStock: lowStock.map(formatAlertItem),
    expiring: expiring.map(formatAlertItem),
  };
}

export async function storeCreateInventory(input: {
  pharmacyId: string;
  branchId: string;
  medicationId: string;
  batchNumber?: string;
  quantity: number;
  unitCost?: number;
  sellingPrice?: number;
  minimumStockLevel?: number;
  expiryDate?: string;
  stockLocation?: string | null;
}): Promise<Record<string, unknown>> {
  const stockLocationId = await resolveStockLocationId({
    pharmacyId: input.pharmacyId,
    value: input.stockLocation,
  });

  return createInventoryRow({
    pharmacyId: input.pharmacyId,
    branchId: input.branchId,
    medicationId: input.medicationId,
    batchNumber: input.batchNumber ?? "BATCH001",
    quantityInStock: input.quantity,
    unitCost: input.unitCost ?? 0,
    sellingPrice: input.sellingPrice ?? 0,
    minimumStockLevel: input.minimumStockLevel ?? 0,
    expiryDate: input.expiryDate ?? "2025-12-31",
    stockLocationId,
  });
}

export async function storeAddMedicationInventory(body: {
  name: string;
  category: string;
  quantity?: string | number;
  batch_number?: string;
  unit_cost?: string | number;
  selling_price?: string | number;
  minimum_stock_level?: string | number;
  expiry_date?: string;
  stockLocation?: string | null;
  stock_location?: string | null;
  stock_location_id?: string | null;
  pharmacyId: string;
  branchId: string;
}): Promise<{
  success: true;
  message?: string;
  medicationId: string;
  inventory: Record<string, unknown>;
}> {
  const categoryMap: Record<string, medication_category> = {
    "Pain Relief": "otc",
    Antibiotics: "prescription",
    Vitamins: "supplement",
    Prescription: "prescription",
    OTC: "otc",
    Controlled: "controlled",
    "Medical Device": "medical_device",
    general: "otc",
  };
  const categoryEnum = categoryMap[body.category] ?? "otc";
  const quantity = parseInt(String(body.quantity ?? 0), 10) || 0;
  const stockLocationId = await resolveStockLocationId({
    pharmacyId: body.pharmacyId,
    value: body.stock_location_id ?? body.stockLocation ?? body.stock_location,
  });

  let medicationId: string;

  const existingMed = await findMedicationByName(body.pharmacyId, body.name);
  if (existingMed) {
    medicationId = existingMed.id;
    const existingInventory = await findInventoryByMedicationBranch({
      pharmacyId: body.pharmacyId,
      branchId: body.branchId,
      medicationId,
    });
    if (existingInventory) {
      const newQuantity = (existingInventory.quantity_in_stock ?? 0) + quantity;
      await updateInventoryQuantity(existingInventory.id, newQuantity);
      if (stockLocationId) {
        await updateInventoryItem(existingInventory.id, {
          stock_location_id: stockLocationId,
        });
      }
      return {
        success: true,
        message: "Quantity updated",
        medicationId,
        inventory: {
          id: existingInventory.id,
          quantity_in_stock: newQuantity,
          stock_location_id: stockLocationId,
        },
      };
    }
  } else {
    const newMed = await createMedication({
      pharmacyId: body.pharmacyId,
      name: body.name,
      category: categoryEnum,
      requiresPrescription: categoryEnum === "prescription",
    });
    medicationId = newMed.id;
  }

  const inventory = await createInventoryRow({
    pharmacyId: body.pharmacyId,
    branchId: body.branchId,
    medicationId,
    batchNumber: body.batch_number || "BATCH001",
    quantityInStock: quantity,
    unitCost: parseFloat(String(body.unit_cost ?? 0)) || 0,
    sellingPrice: parseFloat(String(body.selling_price ?? 0)) || 0,
    minimumStockLevel: parseInt(String(body.minimum_stock_level ?? 0), 10) || 0,
    expiryDate: body.expiry_date || "2025-12-31",
    stockLocationId,
  });

  return { success: true, medicationId, inventory };
}

export async function storeUpdateInventory(
  id: string,
  data: {
    quantity?: number;
    selling_price?: number;
    minimum_stock_level?: number;
    unit_cost?: number;
    stock_location_id?: string | null;
  },
): Promise<void> {
  await updateInventoryItem(id, {
    quantity_in_stock: data.quantity,
    selling_price: data.selling_price,
    minimum_stock_level: data.minimum_stock_level,
    unit_cost: data.unit_cost,
    stock_location_id: data.stock_location_id,
  });
}

export async function storeDeleteInventory(id: string): Promise<void> {
  await deleteInventoryItem(id);
}

export async function storeAdjustInventoryQuantity(
  id: string,
  adjustmentType: "increase" | "decrease",
  quantity: number,
): Promise<number> {
  const current = await getInventoryQuantity(id);

  if (current === null) {
    throw new Error("Product not found");
  }

  const newStock =
    adjustmentType === "increase"
      ? current + quantity
      : Math.max(0, current - quantity);

  await updateInventoryQuantity(id, newStock);

  return newStock;
}

export async function storeListInventoryTransfers(
  pharmacyId: string,
): Promise<InventoryTransferRow[]> {
  return listInventoryTransfersForPharmacy(pharmacyId);
}

export async function storeListActiveSuppliers(): Promise<SupplierRow[]> {
  return listActiveSuppliersFromDb();
}

export async function storeCreateSupplier(input: {
  pharmacyId: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}): Promise<SupplierRow> {
  return createSupplierFromDb(input);
}
