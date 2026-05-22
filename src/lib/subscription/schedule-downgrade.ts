import type { SupabaseClient } from "@supabase/supabase-js";
import { createSubscriptionOrchestrator } from "./orchestrator";

export type ScheduleDowngradeResult = {
  subscriptionId: string;
  effectiveAt: string;
  currentPlan: { id: string; name: string; price: number };
  scheduledPlan: { id: string; name: string; price: number };
  replaced: boolean;
};

/** @deprecated Use SubscriptionOrchestrator.scheduleDowngrade */
export async function scheduleSubscriptionDowngrade(
  admin: SupabaseClient,
  pharmacyId: string,
  targetPlanIdOrName: string
): Promise<ScheduleDowngradeResult> {
  return createSubscriptionOrchestrator(admin).scheduleDowngrade(
    pharmacyId,
    targetPlanIdOrName
  );
}
