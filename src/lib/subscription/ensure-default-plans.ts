// Plans are created and managed by the admin through the dashboard.
// This file is kept for backward compatibility but no longer seeds hardcoded plans.

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Previously seeded hardcoded plans when the catalog was empty.
 * Now a no-op — the admin creates all plans through the subscription management UI.
 */
export async function ensureDefaultSubscriptionPlans(
  _admin: SupabaseClient
): Promise<void> {
<<<<<<< HEAD
  // No-op: plans are managed by the admin, not seeded from code.
=======
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
    }))
  );

  if (insertError) {
    throw insertError;
  }
>>>>>>> 313716b48a93eb34c93cede1cb263a21779e3d51
}
