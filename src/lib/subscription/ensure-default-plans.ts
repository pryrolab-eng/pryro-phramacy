import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_SUBSCRIPTION_PLANS } from "./default-plans";

/** Inserts missing catalog plans (by name). Safe to call on every empty fetch. */
export async function ensureDefaultSubscriptionPlans(
  admin: SupabaseClient
): Promise<void> {
  const { data: existing, error } = await admin
    .from("subscription_plans")
    .select("name");

  if (error) {
    throw error;
  }

  const names = new Set(
    (existing ?? []).map((row) => String(row.name).toLowerCase())
  );

  const missing = DEFAULT_SUBSCRIPTION_PLANS.filter(
    (plan) => !names.has(plan.name.toLowerCase())
  );

  if (missing.length === 0) {
    return;
  }

  const { error: insertError } = await admin.from("subscription_plans").insert(
    missing.map((plan) => ({
      ...plan,
      is_active: true,
    }))
  );

  if (insertError) {
    throw insertError;
  }
}
