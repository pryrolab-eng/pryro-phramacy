import type { SupabaseClient } from "@supabase/supabase-js";
import { createSubscriptionOrchestrator, SubscriptionPlanChangeError } from "./orchestrator";
import type { CatalogPlan } from "./create-pending-upgrade";

export { SubscriptionPlanChangeError };

/**
 * @deprecated Prefer SubscriptionOrchestrator.validatePlanUpgrade
 */
export async function assertUpgradeAndClearSchedule(
  admin: SupabaseClient,
  pharmacyId: string,
  targetPlan: CatalogPlan
): Promise<void> {
  await createSubscriptionOrchestrator(admin).validatePlanUpgrade(
    pharmacyId,
    targetPlan.id
  );
}
