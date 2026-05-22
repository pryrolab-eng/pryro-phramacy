import type { SupabaseClient } from "@supabase/supabase-js";
import { createSubscriptionOrchestrator } from "./orchestrator";

/** @deprecated Use SubscriptionOrchestrator.cancelScheduledDowngrade */
export async function cancelScheduledSubscriptionChange(
  admin: SupabaseClient,
  pharmacyId: string
): Promise<{ canceled: boolean }> {
  return createSubscriptionOrchestrator(admin).cancelScheduledDowngrade(
    pharmacyId
  );
}
