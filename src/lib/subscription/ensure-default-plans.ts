import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_SUBSCRIPTION_PLANS } from "./default-plans";

/** Inserts missing catalog plans (by name). Safe to call on every empty fetch. */
export async function ensureDefaultSubscriptionPlans(
  admin: SupabaseClient
): Promise<void> {
  const { data: existing, error } = await admin
    .from("subscription_plans")
    .select("name")
    .eq("is_active", true);

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
      plan_type: "main",
      billing_period: plan.price === 0 ? "free" : "monthly",
      max_branches: plan.max_branches ?? 1,
      max_users: plan.max_users ?? 5,
      monthly_tx_limit: plan.monthly_tx_limit ?? 500,
    }))
  );

  if (insertError) {
    throw insertError;
  }
}
