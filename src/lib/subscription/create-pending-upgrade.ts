import { createSubscriptionOrchestrator } from "./orchestrator";

export type CatalogPlan = {
  id: string;
  name: string;
  price: number | string | null;
  period?: string | null;
};

export type UpgradeResult = {
  id: string;
  planId: string;
  planName: string;
  amount: number;
  requiresPayment: boolean;
  isActive: boolean;
  expiresAt: string;
};

/**
 * @deprecated Use SubscriptionOrchestrator.requestPlanChange
 */
export async function createSubscriptionUpgrade(
  pharmacyId: string,
  plan: CatalogPlan,
): Promise<UpgradeResult> {
  const orch = createSubscriptionOrchestrator();
  const planPrice = Number(plan.price ?? 0);

  if (planPrice <= 0) {
    const result = await orch.activateFreePlan(pharmacyId, plan.id);
    return {
      id: result.subscriptionId,
      planId: result.planId,
      planName: result.planName,
      amount: 0,
      requiresPayment: false,
      isActive: true,
      expiresAt: result.expiresAt,
    };
  }

  const pending = await orch.beginPaidPlanChange(pharmacyId, plan.id);
  return {
    id: pending.subscriptionId,
    planId: pending.planId,
    planName: pending.planName,
    amount: pending.amount,
    requiresPayment: true,
    isActive: false,
    expiresAt: "",
  };
}
