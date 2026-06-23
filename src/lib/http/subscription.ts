import { fetchJson } from "./client";

export const subscriptionKeys = {
  all: ["subscription"] as const,
  status: () => [...subscriptionKeys.all, "status"] as const,
  scheduledChange: () => [...subscriptionKeys.all, "scheduled-change"] as const,
  planLimits: () => [...subscriptionKeys.all, "plan-limits"] as const,
};

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

export type SubscriptionStatusResponse = {
  expiresAt?: string | null;
  scheduledChange?: ScheduledChangeResponse["scheduledChange"];
  [key: string]: unknown;
};

export type PlanLimitsResponse = {
  canAddUser?: { overLimit?: boolean; reason?: string };
  usage?: { activeUsers: number; activeBranches: number };
  limits?: { maxBranches?: number | null; maxUsers?: number | null };
};

export async function upgradeSubscription(planId: string): Promise<{
  success?: boolean;
  error?: string;
  subscription?: unknown;
}> {
  return fetchJson("/api/subscriptions/upgrade", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId }),
  });
}

export async function createPendingSubscription(planId: string) {
  const data = await fetchJson<{
    subscription: {
      id: string;
      planName?: string;
      requiresPayment?: boolean;
    };
    error?: string;
  }>("/api/subscriptions/upgrade", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId }),
  });
  if (!data.subscription) {
    throw new Error(data.error || "Could not create subscription.");
  }
  return data.subscription;
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
  return fetchJson<SubscriptionStatusResponse>("/api/subscriptions/status", {
    credentials: "include",
    cache: "no-store",
  });
}

export async function getScheduledChange(): Promise<ScheduledChangeResponse> {
  return fetchJson<ScheduledChangeResponse>(
    "/api/subscriptions/scheduled-change",
    {
      credentials: "include",
      cache: "no-store",
    },
  );
}

export async function scheduleSubscriptionDowngrade(targetPlanId: string) {
  return fetchJson<{
    success: boolean;
    effectiveAt: string;
    currentPlan: { id: string; name: string; price: number };
    scheduledPlan: { id: string; name: string; price: number };
    replaced?: boolean;
    error?: string;
  }>("/api/subscriptions/schedule-downgrade", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_plan_id: targetPlanId }),
  });
}

export async function cancelScheduledChange() {
  return fetchJson("/api/subscriptions/scheduled-change", {
    method: "DELETE",
    credentials: "include",
  });
}

export async function getPlanLimits(): Promise<PlanLimitsResponse> {
  return fetchJson<PlanLimitsResponse>("/api/subscriptions/plan-limits", {
    credentials: "include",
    cache: "no-store",
  });
}

export type PaidCheckoutContext = "onboarding" | "settings" | "billing";

export async function startPolarSubscriptionCheckout(params: {
  planId: string;
  subscriptionId: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  returnContext: PaidCheckoutContext;
}) {
  const data = await fetchJson<{ checkoutUrl: string; checkoutId: string; error?: string }>(
    "/api/polar/checkout",
    {
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
    },
  );
  if (!data.checkoutUrl) {
    throw new Error(data.error || "Card checkout could not be started.");
  }
  return data;
}

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
  const data = await fetchJson<{
    subscription: {
      id: string;
      planId: string;
      planName: string;
      amount: number;
      branchId: string;
      branchName: string;
      status: string;
    };
    error?: string;
  }>("/api/subscriptions/branch-addon", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      planId: params.planId,
      branchId: params.branchId,
      branch: params.branch,
    }),
  });
  if (!data.subscription) {
    throw new Error(data.error || "Could not start branch add-on checkout.");
  }
  return data.subscription;
}
