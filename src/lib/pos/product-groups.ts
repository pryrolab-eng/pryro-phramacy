import { medicationCategoryMatchesFilter } from "@/lib/pharmacy/medication-category";
import {
  type PosBatchLine,
  allocateFefo,
  filterSellableBatches,
  sortBatchesFefo,
} from "./pharmacy-rules";

export type PosProductGroup = {
  medicationId: string;
  name: string;
  strength: string | null;
  dosageForm: string | null;
  genericName: string | null;
  requiresPrescription: boolean;
  category: string | null;
  barcode: string | null;
  totalStock: number;
  batchCount: number;
  nearestExpiry: string | null;
  nearestExpiryDays: number;
  /** Primary batch to sell first (FEFO). */
  fefoBatch: PosBatchLine;
  batches: PosBatchLine[];
};

export function groupPosProducts(products: PosBatchLine[]): PosProductGroup[] {
  const byMedication = new Map<string, PosBatchLine[]>();

  for (const row of filterSellableBatches(products)) {
    const key = row.medicationId || row.id;
    const list = byMedication.get(key) ?? [];
    list.push(row);
    byMedication.set(key, list);
  }

  const groups: PosProductGroup[] = [];

  for (const [medicationId, batches] of Array.from(byMedication.entries())) {
    const sorted: PosBatchLine[] = sortBatchesFefo(batches);
    const fefoBatch = sorted[0];
    if (!fefoBatch) continue;

    groups.push({
      medicationId,
      name: fefoBatch.name,
      strength: fefoBatch.strength ?? null,
      dosageForm: fefoBatch.dosageForm ?? null,
      genericName: fefoBatch.genericName ?? null,
      requiresPrescription: batches.some((b) => b.requiresPrescription),
      category: fefoBatch.category ?? null,
      barcode: fefoBatch.barcode ?? null,
      totalStock: batches.reduce((s, b) => s + b.stock, 0),
      batchCount: batches.length,
      nearestExpiry: fefoBatch.expiryDate,
      nearestExpiryDays: fefoBatch.daysToExpiry,
      fefoBatch,
      batches: sorted,
    });
  }

  return groups.sort((a, b) => a.name.localeCompare(b.name));
}

export function filterProductGroups(
  groups: PosProductGroup[],
  searchTerm: string,
  category: string,
): PosProductGroup[] {
  const q = searchTerm.trim().toLowerCase();
  return groups.filter((g) => {
    const matchesCategory = medicationCategoryMatchesFilter(
      category,
      g.category,
    );
    if (!matchesCategory) return false;
    if (!q) return true;
    return (
      g.name.toLowerCase().includes(q) ||
      (g.genericName?.toLowerCase().includes(q) ?? false) ||
      (g.barcode?.includes(searchTerm.trim()) ?? false) ||
      (g.strength?.toLowerCase().includes(q) ?? false) ||
      (g.dosageForm?.toLowerCase().includes(q) ?? false)
    );
  });
}

export function formatProductGroupLabel(g: PosProductGroup): string {
  const parts = [g.name];
  if (g.strength) parts.push(g.strength);
  if (g.dosageForm) parts.push(g.dosageForm);
  return parts.join(" · ");
}

/** Verify a requested quantity can be fulfilled via FEFO for this medication. */
export function canFulfillMedicationQuantity(
  batches: PosBatchLine[],
  quantity: number,
): boolean {
  return !allocateFefo(batches, quantity).error;
}
