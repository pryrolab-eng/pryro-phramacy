import { createSubscriptionOrchestrator } from "./orchestrator";

/** @deprecated Use SubscriptionOrchestrator.cancelScheduledDowngrade */
export async function cancelScheduledSubscriptionChange(
  pharmacyId: string,
): Promise<{ canceled: boolean }> {
  return createSubscriptionOrchestrator().cancelScheduledDowngrade(
    pharmacyId
  );
}
