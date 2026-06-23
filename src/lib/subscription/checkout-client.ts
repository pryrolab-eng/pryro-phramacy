/** Client helpers for paid subscription checkout (Polar). */

export type { PaidCheckoutContext, ScheduledChangeResponse } from "@/lib/http/subscription";

export {
  cancelScheduledChange,
  createPendingBranchAddon,
  createPendingSubscription,
  getScheduledChange as fetchScheduledChange,
  scheduleSubscriptionDowngrade,
  startPolarSubscriptionCheckout,
} from "@/lib/http/subscription";

export async function fetchSubscriptionStatus() {
  const { getSubscriptionStatus } = await import("@/lib/http/subscription");
  return getSubscriptionStatus();
}
