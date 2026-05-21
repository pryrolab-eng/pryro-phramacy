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
  // No-op: plans are managed by the admin, not seeded from code.
}
