/** Pharmacy POS rules: expiry, FEFO, prescription gates. */

export const NEAR_EXPIRY_WARNING_DAYS = 30;

export type PosBatchLine = {
  id: string;
  medicationId: string;
  name: string;
  price: number;
  stock: number;
  batch: string;
  expiryDate: string | null;
  daysToExpiry: number;
  requiresPrescription: boolean;
  strength?: string | null;
  dosageForm?: string | null;
  genericName?: string | null;
  barcode?: string | null;
  category?: string | null;
};

export function computeDaysToExpiry(expiryDate: string | null | undefined): number {
  if (!expiryDate) return 9999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  if (Number.isNaN(exp.getTime())) return 9999;
  exp.setHours(0, 0, 0, 0);
  return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function isExpired(daysToExpiry: number): boolean {
  return daysToExpiry < 0;
}

export function isNearExpiry(
  daysToExpiry: number,
  threshold = NEAR_EXPIRY_WARNING_DAYS,
): boolean {
  return daysToExpiry >= 0 && daysToExpiry <= threshold;
}

export function sortBatchesFefo<T extends { daysToExpiry: number; expiryDate?: string | null }>(
  rows: T[],
): T[] {
  return [...rows].sort((a, b) => {
    if (a.daysToExpiry !== b.daysToExpiry) return a.daysToExpiry - b.daysToExpiry;
    const ea = a.expiryDate ?? "";
    const eb = b.expiryDate ?? "";
    return ea.localeCompare(eb);
  });
}

export function filterSellableBatches<T extends PosBatchLine>(rows: T[]): T[] {
  return rows.filter((r) => r.stock > 0 && !isExpired(r.daysToExpiry));
}

export type FefoAllocation = { batch: PosBatchLine; quantity: number };

/** Allocate quantity across batches using FEFO (nearest expiry first). */
export function allocateFefo(
  batches: PosBatchLine[],
  quantity: number,
): { lines: FefoAllocation[]; error?: string } {
  if (quantity <= 0) return { lines: [] };

  const sorted = sortBatchesFefo(filterSellableBatches(batches));
  let remaining = quantity;
  const lines: FefoAllocation[] = [];

  for (const batch of sorted) {
    if (remaining <= 0) break;
    const take = Math.min(batch.stock, remaining);
    if (take > 0) {
      lines.push({ batch, quantity: take });
      remaining -= take;
    }
  }

  if (remaining > 0) {
    return {
      lines,
      error: `Insufficient stock (short by ${remaining})`,
    };
  }

  return { lines };
}

export type PrescriptionConfirmation = {
  confirmed: boolean;
  patientName?: string;
  prescriberName?: string;
  notes?: string;
};

export function cartRequiresPrescription(
  items: Array<{ requiresPrescription?: boolean }>,
): boolean {
  return items.some((i) => i.requiresPrescription);
}

export function validatePrescriptionForSale(
  items: Array<{ requiresPrescription?: boolean; name?: string }>,
  confirmation?: PrescriptionConfirmation | null,
): string | null {
  const rxItems = items.filter((i) => i.requiresPrescription);
  if (rxItems.length === 0) return null;
  const names = rxItems.map((i) => i.name).filter(Boolean).join(", ");
  if (!confirmation?.confirmed) {
    return `Prescription confirmation required for: ${names || "controlled items"}`;
  }
  if (!confirmation.prescriberName?.trim()) {
    return `Prescriber / doctor name is required for: ${names || "controlled items"}`;
  }
  return null;
}

export function validateNoExpiredInCart(
  items: Array<{ name?: string; daysToExpiry?: number }>,
): string | null {
  const expired = items.filter((i) => isExpired(i.daysToExpiry ?? 9999));
  if (expired.length === 0) return null;
  return `Cannot sell expired stock: ${expired.map((i) => i.name).join(", ")}`;
}

export function cartHasNearExpiry(
  items: Array<{ daysToExpiry?: number }>,
  threshold = NEAR_EXPIRY_WARNING_DAYS,
): boolean {
  return items.some((i) => isNearExpiry(i.daysToExpiry ?? 9999, threshold));
}
