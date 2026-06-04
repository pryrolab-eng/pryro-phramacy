import type { SupabaseClient } from "@supabase/supabase-js";

export const SHIFT_REQUIRED_CODE = "SHIFT_REQUIRED";

export type OpenCashierShiftRow = {
  id: string;
  total_sales: number | null;
  total_refunds: number | null;
  transaction_count: number | null;
  opened_at: string;
  opening_cash: number;
};

export async function fetchOpenCashierShift(
  supabase: SupabaseClient,
  cashierId: string,
  branchId: string,
): Promise<OpenCashierShiftRow | null> {
  const { data, error } = await supabase
    .from("cashier_shifts")
    .select(
      "id, total_sales, total_refunds, transaction_count, opened_at, opening_cash",
    )
    .eq("cashier_id", cashierId)
    .eq("branch_id", branchId)
    .eq("status", "open")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export const SHIFT_REQUIRED_MESSAGE =
  "Open a cashier shift before completing a sale or return.";
