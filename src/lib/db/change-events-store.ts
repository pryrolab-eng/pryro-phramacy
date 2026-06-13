import { logSubscriptionChangeEventFromDb } from "@/lib/db/change-events";
import type { SubscriptionChangeEventType } from "@/lib/subscription/change-events";

export async function storeLogSubscriptionChangeEvent(params: {
  pharmacyId: string;
  subscriptionId?: string | null;
  event: SubscriptionChangeEventType;
  fromPlanId?: string | null;
  toPlanId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  return logSubscriptionChangeEventFromDb(params);
}
