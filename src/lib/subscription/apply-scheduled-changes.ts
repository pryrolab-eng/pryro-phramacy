import type { SupabaseClient } from "@supabase/supabase-js";
import { createSubscriptionOrchestrator } from "./orchestrator";

export type ApplyScheduledChangesResult = {
  processed: number;
  applied: number;
  skipped: number;
  errors: string[];
  expired: number;
};

/** @deprecated Use SubscriptionOrchestrator.applyDueScheduledChanges + processExpiredSubscriptions */
export async function applyScheduledSubscriptionChanges(
  admin: SupabaseClient
): Promise<ApplyScheduledChangesResult> {
  const orch = createSubscriptionOrchestrator(admin);
  const transitions = await orch.applyDueScheduledChanges();
  const { expired } = await orch.processExpiredSubscriptions();
  return { ...transitions, expired };
}
