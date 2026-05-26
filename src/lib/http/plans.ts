import { fetchJson } from "./client";

export const plansKeys = {
  all: ["plans"] as const,
  catalog: () => [...plansKeys.all, "catalog"] as const,
};

export type PlanRow = {
  id: string;
  name: string;
  price: number;
  period?: string;
  features?: string[] | null;
  is_popular?: boolean | null;
  plan_type?: string;
  billing_period?: string;
  monthly_tx_limit?: number;
  max_users?: number;
  max_branches?: number;
  [key: string]: unknown;
};

export async function getSubscriptionPlans(): Promise<PlanRow[]> {
  const data = await fetchJson<PlanRow[]>("/api/plans", {
    credentials: "include",
    cache: "no-store",
  });
  return Array.isArray(data) ? data : [];
}
