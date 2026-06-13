import {
  fetchPharmacySaleTotalsFromDb,
  fetchRecentSalesForCustomerFromDb,
} from "@/lib/db/customers";

export type SaleAggregateRow = {
  total_amount: number | string | null;
  customer_phone: string | null;
  customer_name: string | null;
};

function normalizePhone(phone: string) {
  return phone.trim();
}

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

export function buildSalesTotalsIndex(rows: SaleAggregateRow[]) {
  const byPhone = new Map<string, number>();
  const byName = new Map<string, number>();

  for (const row of rows) {
    const amount = Number(row.total_amount ?? 0);
    const phone = row.customer_phone?.trim();
    if (phone) {
      const key = normalizePhone(phone);
      byPhone.set(key, (byPhone.get(key) ?? 0) + amount);
    }
    const name = row.customer_name?.trim();
    if (name) {
      const key = normalizeName(name);
      byName.set(key, (byName.get(key) ?? 0) + amount);
    }
  }

  return { byPhone, byName };
}

export function lookupCustomerTotal(
  index: ReturnType<typeof buildSalesTotalsIndex>,
  name: string,
  phone: string | null | undefined,
): number {
  const trimmedPhone = phone?.trim();
  if (trimmedPhone) {
    const byPhone = index.byPhone.get(normalizePhone(trimmedPhone));
    if (byPhone !== undefined) return byPhone;
  }
  const trimmedName = name?.trim();
  if (trimmedName) {
    return index.byName.get(normalizeName(trimmedName)) ?? 0;
  }
  return 0;
}

/** All sale lines for a pharmacy — used to compute lifetime spend on list/detail. */
export async function fetchPharmacySaleTotals(
  pharmacyId: string,
): Promise<SaleAggregateRow[]> {
  const rows = await fetchPharmacySaleTotalsFromDb(pharmacyId);
  return rows.map((row) => ({
    total_amount: row.total_amount != null ? Number(row.total_amount) : null,
    customer_phone: row.customer_phone,
    customer_name: row.customer_name,
  }));
}

export async function fetchRecentSalesForCustomer(
  pharmacyId: string,
  name: string,
  phone: string | null,
  limit = 20,
) {
  return fetchRecentSalesForCustomerFromDb({
    pharmacyId,
    name,
    phone,
    limit,
  });
}
