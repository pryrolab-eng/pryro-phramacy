import type { SupabaseClient } from "@supabase/supabase-js";
import { createSubscriptionOrchestrator } from "./orchestrator";

/** @deprecated Use SubscriptionOrchestrator — clears schedule on a subscription row's pharmacy */
export async function clearScheduledChange(
  admin: SupabaseClient,
  subscriptionId: string
): Promise<void> {
  const { data: sub } = await admin
    .from("subscriptions")
    .select("pharmacy_id")
    .eq("id", subscriptionId)
    .maybeSingle();

  if (!sub?.pharmacy_id) return;

  await createSubscriptionOrchestrator(admin).cancelScheduledDowngrade(
    sub.pharmacy_id as string
  );
}
