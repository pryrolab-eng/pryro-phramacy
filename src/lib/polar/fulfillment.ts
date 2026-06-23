import { recordSubscriptionPayment } from "@/lib/billing/record-subscription-payment";
import { activatePaidSubscription } from "@/lib/subscription/activate-subscription";
import {
  storeFindPaymentTransactionByPolarCheckoutId,
  storeUpdatePaymentTransaction,
} from "@/lib/db/payment-transactions-store";

export type PolarCheckoutMetadata = {
  pharmacy_id?: string;
  subscription_id?: string;
  plan_name?: string;
  return_context?: string;
};

export function parsePolarMetadata(
  raw: Record<string, unknown> | null | undefined,
): PolarCheckoutMetadata {
  if (!raw) return {};
  return {
    pharmacy_id:
      typeof raw.pharmacy_id === "string" ? raw.pharmacy_id : undefined,
    subscription_id:
      typeof raw.subscription_id === "string"
        ? raw.subscription_id
        : undefined,
    plan_name:
      typeof raw.plan_name === "string" ? raw.plan_name : undefined,
    return_context:
      typeof raw.return_context === "string"
        ? raw.return_context
        : undefined,
  };
}

/** Activate subscription and pharmacy after Polar payment succeeds. */
export async function fulfillPolarSubscription(
  meta: PolarCheckoutMetadata,
  polarCheckoutId?: string,
): Promise<{ ok: boolean; error?: string }> {
  const subscriptionId = meta.subscription_id;

  if (!subscriptionId) {
    return { ok: false, error: "Missing subscription_id in Polar metadata" };
  }

  const activated = await activatePaidSubscription(subscriptionId, {
    paymentMethod: "polar",
    paymentReference: polarCheckoutId ?? null,
    planName: meta.plan_name,
  });

  if (!activated.ok) {
    return activated;
  }

  if (polarCheckoutId) {
    const paidTx = await storeFindPaymentTransactionByPolarCheckoutId(
      polarCheckoutId,
    );

    if (paidTx) {
      await storeUpdatePaymentTransaction(paidTx.id, {
        status: "completed",
        completed_at: new Date().toISOString(),
        payment_provider: "polar",
      });
      await recordSubscriptionPayment(paidTx.id);
    }
  }

  return { ok: true };
}
