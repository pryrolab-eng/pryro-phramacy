import { computeDaysToExpiry, type PosBatchLine } from "./pharmacy-rules";

type RawInventoryRow = {
  id: string;
  medication_id?: string | null;
  batch_number: string | null;
  quantity_in_stock: number;
  selling_price: number | string | null;
  expiry_date: string | null;
  medications: unknown;
};

type MedicationRelation = {
  id?: string;
  name?: string;
  category?: string;
  generic_name?: string | null;
  strength?: string | null;
  dosage_form?: string | null;
  barcode?: string | null;
  requires_prescription?: boolean | null;
};

export function formatInventoryRowForPos(
  item: RawInventoryRow,
  medication: MedicationRelation | null,
): PosBatchLine {
  const daysToExpiry = computeDaysToExpiry(item.expiry_date);
  const price = Number(item.selling_price) || 0;

  return {
    id: item.id,
    medicationId: medication?.id ?? item.medication_id ?? item.id,
    name: medication?.name ?? "Unknown Product",
    price,
    stock: item.quantity_in_stock ?? 0,
    batch: item.batch_number ?? "—",
    expiryDate: item.expiry_date,
    daysToExpiry,
    requiresPrescription: Boolean(medication?.requires_prescription),
    strength: medication?.strength ?? null,
    dosageForm: medication?.dosage_form ?? null,
    genericName: medication?.generic_name ?? null,
    barcode: medication?.barcode ?? null,
    category: medication?.category ?? "general",
  };
}
