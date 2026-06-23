import type { CatalogPlanInput } from "@/lib/subscription/lifecycle/types";
import {
  findBranchAddonPlanFromDb,
  getCatalogPlanDetailsById,
  getActiveSubscriptionForStatus,
  listActiveCatalogPlansFromDb,
  listRecentCompletedSubscriptionPayments,
  resolveCatalogPlanFromDb,
  type ActiveSubscriptionStatusRow,
  type CompletedPaymentRow,
} from "@/lib/db/subscriptions";

export type { ActiveSubscriptionStatusRow, CompletedPaymentRow };

export async function storeGetActiveSubscriptionForStatus(
  pharmacyId: string,
): Promise<ActiveSubscriptionStatusRow | null> {
  return getActiveSubscriptionForStatus(pharmacyId);
}

export async function storeListRecentCompletedSubscriptionPayments(input: {
  pharmacyId: string;
  subscriptionId: string;
  limit?: number;
}): Promise<CompletedPaymentRow[]> {
  return listRecentCompletedSubscriptionPayments(input);
}

export async function storeResolveCatalogPlan(
  planIdOrName: string,
): Promise<CatalogPlanInput> {
  return resolveCatalogPlanFromDb(planIdOrName);
}

export async function storeFindBranchAddonPlan(
  planIdOrName: string,
): Promise<Record<string, unknown> | null> {
  return findBranchAddonPlanFromDb(planIdOrName);
}

export async function storeGetCatalogPlanDetailsById(
  planId: string,
): Promise<{
  id: string;
  name: string;
  price: number;
  period: string;
  billing_period: string;
  plan_type: string;
  monthly_tx_limit: number;
} | null> {
  return getCatalogPlanDetailsById(planId);
}

export async function storeListActiveCatalogPlans(input?: {
  planType?: "main" | "branch_addon";
}): Promise<Record<string, unknown>[]> {
  return listActiveCatalogPlansFromDb(input);
}
