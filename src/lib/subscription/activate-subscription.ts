import { createSubscriptionOrchestrator } from "./orchestrator";

/**
 * @deprecated Use SubscriptionOrchestrator.activateAfterPayment — thin delegate for webhooks.
 */
export async function activatePaidSubscription(
  subscriptionId: string,
  options?: {
    paymentMethod?: string;
    paymentReference?: string | null;
    planName?: string;
  },
): Promise<{ ok: boolean; error?: string }> {
  const result = await createSubscriptionOrchestrator().activateAfterPayment(
    subscriptionId,
    {
      paymentMethod: options?.paymentMethod,
      paymentReference: options?.paymentReference,
      planName: options?.planName,
    },
  );
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true };
}

/**
 * @deprecated Use SubscriptionOrchestrator.activateFreePlan
 */
export async function activateFreeSubscription(
  pharmacyId: string,
  plan: {
    id: string;
    name: string;
    period?: string | null;
    price?: number | string | null;
  },
): Promise<{ subscriptionId: string }> {
  const result = await createSubscriptionOrchestrator().activateFreePlan(
    pharmacyId,
    plan.id,
  );
  return { subscriptionId: result.subscriptionId };
}
