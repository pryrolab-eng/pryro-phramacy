import type { SupabaseClient } from "@supabase/supabase-js";
import { createSubscriptionOrchestrator } from "./orchestrator";

export type ScheduledChangeInfo = {
  subscriptionId: string;
  status: "scheduled";
  effectiveAt: string;
  changeType: "downgrade";
  currentPlan: { id: string; name: string; price: number } | null;
  targetPlan: { id: string; name: string; price: number };
};

export async function getScheduledSubscriptionChange(
  admin: SupabaseClient,
  pharmacyId: string
): Promise<ScheduledChangeInfo | null> {
  const scheduled = await createSubscriptionOrchestrator(
    admin
  ).getScheduledChange(pharmacyId);

  if (!scheduled) return null;

  return {
    subscriptionId: scheduled.subscriptionId,
    status: "scheduled",
    effectiveAt: scheduled.effectiveAt,
    changeType: scheduled.changeType,
    currentPlan: scheduled.currentPlan
      ? {
          id: scheduled.currentPlan.id,
          name: scheduled.currentPlan.name,
          price: scheduled.currentPlan.price,
        }
      : null,
    targetPlan: {
      id: scheduled.targetPlan.id,
      name: scheduled.targetPlan.name,
      price: scheduled.targetPlan.price,
    },
  };
}
