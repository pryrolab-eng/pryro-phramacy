import { ensureApiSuccess, fetchJson } from "./client";
import type {
  PharmacySubscriptionSummary,
  SubscriptionInvoice,
  SubscriptionPlan,
  SubscriptionType,
} from "@/lib/saas/types";

export const saasKeys = {
  all: ["saas"] as const,
  plans: () => [...saasKeys.all, "plans"] as const,
  subscription: () => [...saasKeys.all, "subscription"] as const,
  branches: () => [...saasKeys.all, "branches"] as const,
  invoices: (month?: string) => [...saasKeys.all, "invoices", month] as const,
  adminSubscriptions: (status?: string) =>
    [...saasKeys.all, "admin", "subscriptions", status] as const,
};

export async function getSaasPlans(): Promise<SubscriptionPlan[]> {
  const data = await fetchJson<{ plans: SubscriptionPlan[] }>("/api/saas/plans");
  return data.plans ?? [];
}

export async function getSaasSubscriptionSummary(): Promise<PharmacySubscriptionSummary> {
  const data = await fetchJson<{ summary: PharmacySubscriptionSummary }>(
    "/api/saas/subscription",
  );
  if (!data.summary) {
    throw new Error("Failed to load subscription");
  }
  return data.summary;
}

export type SubscribeToSaasPlanInput = {
  plan_id: string;
  subscription_type?: SubscriptionType;
  branch_id?: string;
};

export type SubscribeToSaasPlanResult = {
  subscription: unknown;
  requiresPayment: boolean;
  message?: string;
};

export async function subscribeToSaasPlan(
  params: SubscribeToSaasPlanInput,
): Promise<SubscribeToSaasPlanResult> {
  const data = await fetchJson<{
    subscription?: unknown;
    requiresPayment?: boolean;
    message?: string;
    error?: string;
  }>("/api/saas/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!data.subscription) {
    throw new Error(data.error || "Subscription failed");
  }
  return {
    subscription: data.subscription,
    requiresPayment: Boolean(data.requiresPayment),
    message: data.message,
  };
}

export async function cancelSaasSubscription(subscriptionId: string): Promise<unknown> {
  const data = await fetchJson<{ error?: string }>("/api/saas/subscription/cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription_id: subscriptionId }),
  });
  return data;
}

export async function getSaasInvoices(month?: string): Promise<SubscriptionInvoice[]> {
  const url = month
    ? `/api/saas/invoice?month=${encodeURIComponent(month)}`
    : "/api/saas/invoice";
  const data = await fetchJson<{ invoices: SubscriptionInvoice[] }>(url);
  return data.invoices ?? [];
}

export async function generateSaasInvoice(month?: string): Promise<SubscriptionInvoice> {
  const data = await fetchJson<{ invoice?: SubscriptionInvoice; error?: string }>(
    "/api/saas/invoice",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(month ? { month } : {}),
    },
  );
  if (!data.invoice) {
    throw new Error(data.error || "Failed to generate invoice");
  }
  return data.invoice;
}

export type SaasAdminSubscriptionRow = Record<string, unknown>;

export async function getAdminSaasSubscriptions(
  status?: string,
): Promise<SaasAdminSubscriptionRow[]> {
  const url = status
    ? `/api/saas/admin/subscriptions?status=${encodeURIComponent(status)}`
    : "/api/saas/admin/subscriptions";
  const data = await fetchJson<{ subscriptions: SaasAdminSubscriptionRow[] }>(url);
  return data.subscriptions ?? [];
}

export type CreateSaasPlanInput = {
  name: string;
  price: number;
  billing_period: string;
  plan_type: string;
  max_branches: number;
  max_users: number;
  monthly_tx_limit: number;
  features: string[];
  is_popular?: boolean;
};

export async function createSaasPlan(
  params: CreateSaasPlanInput,
): Promise<SubscriptionPlan> {
  const data = await fetchJson<{ plan?: SubscriptionPlan; error?: string }>(
    "/api/saas/plans",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    },
  );
  if (!data.plan) {
    throw new Error(data.error || "Failed to create plan");
  }
  return data.plan;
}

export async function updateSaasPlan(
  planId: string,
  updates: Record<string, unknown>,
): Promise<SubscriptionPlan> {
  const data = await fetchJson<{ plan?: SubscriptionPlan; error?: string }>(
    `/api/saas/plans/${planId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    },
  );
  if (!data.plan) {
    throw new Error(data.error || "Failed to update plan");
  }
  return data.plan;
}
