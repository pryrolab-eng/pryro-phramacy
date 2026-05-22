/** Client helpers for paid subscription checkout (KPay + Polar). */

export type PaidCheckoutContext = "onboarding" | "settings";

export async function createPendingBranchAddon(params: {
  planId: string;
  branchId?: string;
  branch?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
}) {
  const res = await fetch("/api/subscriptions/branch-addon", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      planId: params.planId,
      branchId: params.branchId,
      branch: params.branch,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Could not start branch add-on checkout.");
  }
  return data.subscription as {
    id: string;
    planId: string;
    planName: string;
    amount: number;
    branchId: string;
    branchName: string;
    status: string;
  };
}

export async function createPendingSubscription(planId: string) {
  const res = await fetch("/api/subscriptions/upgrade", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Could not create subscription.");
  }
  return data.subscription as {
    id: string;
    planName?: string;
    requiresPayment?: boolean;
  };
}

export async function startKpaySubscriptionCheckout(params: {
  plan: { name: string; price: number };
  subscriptionId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  bankId?: string;
}) {
  const res = await fetch("/api/kpay/initiate", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: params.plan.price,
      subscriptionId: params.subscriptionId,
      paymentMethod: "momo",
      bankId: params.bankId || "63510",
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      customerEmail: params.customerEmail,
      details: `${params.plan.name} — subscription`,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Payment could not be started.");
  }
  return data;
}

export async function startPolarSubscriptionCheckout(params: {
  planId: string;
  subscriptionId: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  returnContext: PaidCheckoutContext;
}) {
  const res = await fetch("/api/polar/checkout", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      planId: params.planId,
      subscriptionId: params.subscriptionId,
      customerEmail: params.customerEmail,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      returnContext: params.returnContext,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Card checkout could not be started.");
  }
  return data as { checkoutUrl: string; checkoutId: string };
}

export type ScheduledChangeResponse = {
  scheduledChange: {
    status: "scheduled";
    effectiveAt: string;
    changeType: "downgrade";
    currentPlan: { id: string; name: string; price: number } | null;
    targetPlan: { id: string; name: string; price: number };
    subscriptionId: string;
  } | null;
};

export async function fetchScheduledChange(): Promise<ScheduledChangeResponse> {
  const res = await fetch("/api/subscriptions/scheduled-change", {
    credentials: "include",
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Could not load scheduled change.");
  }
  return data as ScheduledChangeResponse;
}

export async function scheduleSubscriptionDowngrade(targetPlanId: string) {
  const res = await fetch("/api/subscriptions/schedule-downgrade", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_plan_id: targetPlanId }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Could not schedule downgrade.");
  }
  return data as {
    success: boolean;
    effectiveAt: string;
    currentPlan: { id: string; name: string; price: number };
    scheduledPlan: { id: string; name: string; price: number };
    replaced?: boolean;
  };
}

export async function cancelScheduledChange() {
  const res = await fetch("/api/subscriptions/scheduled-change", {
    method: "DELETE",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Could not cancel scheduled change.");
  }
  return data;
}

export async function fetchSubscriptionStatus() {
  const res = await fetch("/api/subscriptions/status", {
    credentials: "include",
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Could not load subscription status.");
  }
  return data;
}

export function pollKpayTransaction(
  transactionId: string,
  onComplete: () => void,
  onFailed: (message: string) => void,
  maxPolls = 60
) {
  let pollCount = 0;
  const interval = setInterval(async () => {
    pollCount++;
    try {
      const res = await fetch(
        `/api/kpay/status?transactionId=${transactionId}`,
        { credentials: "include" }
      );
      const data = await res.json();
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
            : "Payment failed."
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
