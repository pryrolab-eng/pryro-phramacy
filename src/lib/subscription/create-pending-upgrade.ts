import type { SupabaseClient } from "@supabase/supabase-js";
import {
  activateFreeSubscription,
} from "./activate-subscription";
import { computeSubscriptionExpiresAt, planNameToEnum } from "./plan-enum";

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
 * Start an upgrade: free plans activate immediately; paid plans stay pending until payment.
 * Does not change pharmacies.subscription_plan until payment succeeds.
 */
export async function createSubscriptionUpgrade(
  admin: SupabaseClient,
  pharmacyId: string,
  plan: CatalogPlan
): Promise<UpgradeResult> {
  const planPrice = Number(plan.price ?? 0);
  const planEnum = planNameToEnum(plan.name);
  const expiresAt = computeSubscriptionExpiresAt(plan.period);

  if (planPrice <= 0) {
    const { subscriptionId } = await activateFreeSubscription(admin, pharmacyId, plan);
    return {
      id: subscriptionId,
      planId: plan.id,
      planName: plan.name,
      amount: 0,
      requiresPayment: false,
      isActive: true,
      expiresAt: expiresAt.toISOString(),
    };
  }

  // Cancel stale unpaid checkout rows for this pharmacy
  await admin
    .from("subscriptions")
    .update({ payment_method: "cancelled" })
    .eq("pharmacy_id", pharmacyId)
    .eq("is_active", false)
    .eq("payment_method", "pending");

  const { data: subscription, error } = await admin
    .from("subscriptions")
    .insert({
      pharmacy_id: pharmacyId,
      plan_id: plan.id,
      plan: planEnum,
      is_active: false,
      expires_at: expiresAt.toISOString(),
      payment_method: "pending",
    })
    .select("id, expires_at, is_active")
    .single();

  if (error || !subscription) {
    throw new Error(error?.message || "Failed to create pending subscription");
  }

  return {
    id: subscription.id as string,
    planId: plan.id,
    planName: plan.name,
    amount: planPrice,
    requiresPayment: true,
    isActive: false,
    expiresAt: (subscription.expires_at as string) ?? expiresAt.toISOString(),
  };
}
