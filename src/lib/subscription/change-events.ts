import { storeLogSubscriptionChangeEvent } from "@/lib/db/change-events-store";

export type SubscriptionChangeEventType =
  | "downgrade_scheduled"
  | "downgrade_applied"
  | "downgrade_canceled";

export async function logSubscriptionChangeEvent(params: {
  pharmacyId: string;
  subscriptionId?: string | null;
  event: SubscriptionChangeEventType;
  fromPlanId?: string | null;
  toPlanId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  return storeLogSubscriptionChangeEvent(params);
}
