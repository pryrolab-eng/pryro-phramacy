import type { SupabaseClient } from "@supabase/supabase-js";
import { computeSubscriptionExpiresAt, planNameToEnum } from "./plan-enum";

type SubscriptionRow = {
  id: string;
  pharmacy_id: string;
  plan_id: string | null;
  plan: string;
  expires_at: string | null;
};

/**
 * Activate a paid subscription after successful payment.
 * Deactivates other subscriptions and updates the pharmacy record.
 */
export async function activatePaidSubscription(
  admin: SupabaseClient,
  subscriptionId: string,
  options?: {
    paymentMethod?: string;
    paymentReference?: string | null;
    planName?: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  const { data: sub, error: subErr } = await admin
    .from("subscriptions")
    .select("id, pharmacy_id, plan_id, plan, expires_at")
    .eq("id", subscriptionId)
    .maybeSingle();

  if (subErr || !sub) {
    return { ok: false, error: subErr?.message || "Subscription not found" };
  }

  const row = sub as SubscriptionRow;
  let planEnum = planNameToEnum(row.plan);
  let expiresAt = row.expires_at;

  if (row.plan_id) {
    const { data: catalog } = await admin
      .from("subscription_plans")
      .select("name, period")
      .eq("id", row.plan_id)
      .maybeSingle();

    if (catalog?.name) {
      planEnum = planNameToEnum(
        options?.planName ?? String(catalog.name)
      );
    }
  } else if (options?.planName) {
    planEnum = planNameToEnum(options.planName);
  }

  await admin
    .from("subscriptions")
    .update({ is_active: false })
    .eq("pharmacy_id", row.pharmacy_id)
    .neq("id", subscriptionId);

  const { error: activateErr } = await admin
    .from("subscriptions")
    .update({
      is_active: true,
      payment_method: options?.paymentMethod ?? "paid",
      payment_reference: options?.paymentReference ?? null,
    })
    .eq("id", subscriptionId);

  if (activateErr) {
    return { ok: false, error: activateErr.message };
  }

  await admin
    .from("pharmacies")
    .update({
      subscription_plan: planEnum,
      subscription_expires_at: expiresAt,
      status: planEnum === "trial" ? "trial" : "active",
    })
    .eq("id", row.pharmacy_id);

  return { ok: true };
}

/** Activate a free plan immediately (no payment). */
export async function activateFreeSubscription(
  admin: SupabaseClient,
  pharmacyId: string,
  plan: { id: string; name: string; period?: string | null; price?: number | string | null }
): Promise<{ subscriptionId: string }> {
  const planEnum = planNameToEnum(plan.name);
  const expiresAt = computeSubscriptionExpiresAt(plan.period);

  await admin
    .from("subscriptions")
    .update({ is_active: false, payment_method: "cancelled" })
    .eq("pharmacy_id", pharmacyId)
    .eq("is_active", false)
    .eq("payment_method", "pending");

  await admin
    .from("subscriptions")
    .update({ is_active: false })
    .eq("pharmacy_id", pharmacyId);

  const { data: subscription, error } = await admin
    .from("subscriptions")
    .insert({
      pharmacy_id: pharmacyId,
      plan_id: plan.id,
      plan: planEnum,
      is_active: true,
      expires_at: expiresAt.toISOString(),
      payment_method: "free",
    })
    .select("id")
    .single();

  if (error || !subscription) {
    throw new Error(error?.message || "Failed to create subscription");
  }

  await admin
    .from("pharmacies")
    .update({
      subscription_plan: planEnum,
      subscription_expires_at: expiresAt.toISOString(),
      status: planEnum === "trial" ? "trial" : "active",
    })
    .eq("id", pharmacyId);

  return { subscriptionId: subscription.id as string };
}
