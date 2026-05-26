/** Client helpers for paid subscription checkout (KPay + Polar). */

export type { PaidCheckoutContext, ScheduledChangeResponse } from "@/lib/http/subscription";

export {
  cancelScheduledChange,
  createPendingBranchAddon,
  createPendingSubscription,
  getScheduledChange as fetchScheduledChange,
  scheduleSubscriptionDowngrade,
  startKpaySubscriptionCheckout,
  startPolarSubscriptionCheckout,
} from "@/lib/http/subscription";

import { getKpayTransactionStatus } from "@/lib/http/kpay";

export function pollKpayTransaction(
  transactionId: string,
  onComplete: () => void,
  onFailed: (message: string) => void,
  maxPolls = 60,
) {
  let pollCount = 0;
  const interval = setInterval(async () => {
    pollCount++;
    try {
      const data = await getKpayTransactionStatus(transactionId);
      if (data.transaction?.status === "completed") {
        clearInterval(interval);
        onComplete();
      } else if (
        data.transaction?.status === "failed" ||
        pollCount >= maxPolls
      ) {
        clearInterval(interval);
        onFailed(
          pollCount >= maxPolls
            ? "Payment is taking longer than expected."
            : "Payment failed.",
        );
      }
    } catch {
      if (pollCount >= maxPolls) {
        clearInterval(interval);
        onFailed("Could not verify payment status.");
      }
    }
  }, 5000);
  return () => clearInterval(interval);
}

export async function fetchSubscriptionStatus() {
  const { getSubscriptionStatus } = await import("@/lib/http/subscription");
  return getSubscriptionStatus();
}
