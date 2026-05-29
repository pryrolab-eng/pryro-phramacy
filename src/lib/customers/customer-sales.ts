import type { createClient } from "../../../supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

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
  supabase: Supabase,
  pharmacyId: string,
): Promise<SaleAggregateRow[]> {
  const { data, error } = await supabase
    .from("sales")
    .select("total_amount, customer_phone, customer_name")
    .eq("pharmacy_id", pharmacyId);

  if (error) throw error;
  return data ?? [];
}

export async function fetchRecentSalesForCustomer(
  supabase: Supabase,
  pharmacyId: string,
  name: string,
  phone: string | null,
  limit = 20,
) {
  let query = supabase
    .from("sales")
    .select(
      "id, total_amount, customer_name, customer_phone, created_at, receipt_number, payment_method",
    )
    .eq("pharmacy_id", pharmacyId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (phone?.trim()) {
    query = query.eq("customer_phone", phone.trim());
  } else {
    query = query.eq("customer_name", name);
  }

  const { data: sales, error } = await query;
  if (error) throw error;

  const rows = sales ?? [];
  return rows.map((s) => ({
    id: s.id,
    receiptNumber: s.receipt_number,
    totalAmount: Number(s.total_amount ?? 0),
    paymentMethod: s.payment_method,
    createdAt: s.created_at,
  }));
}
