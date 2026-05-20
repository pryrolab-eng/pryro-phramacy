import type { SupabaseClient } from "@supabase/supabase-js";
import { recordSubscriptionPayment } from "@/lib/billing/record-subscription-payment";

export type PolarCheckoutMetadata = {
  pharmacy_id?: string;
  subscription_id?: string;
  plan_name?: string;
  return_context?: string;
};

export function parsePolarMetadata(
  raw: Record<string, unknown> | null | undefined
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
  admin: SupabaseClient,
  meta: PolarCheckoutMetadata,
  polarCheckoutId?: string
): Promise<{ ok: boolean; error?: string }> {
  const subscriptionId = meta.subscription_id;
  const pharmacyId = meta.pharmacy_id;

  if (!subscriptionId) {
    return { ok: false, error: "Missing subscription_id in Polar metadata" };
  }

  const { data: sub, error: subErr } = await admin
    .from("subscriptions")
    .select("id, pharmacy_id, plan_id, expires_at")
    .eq("id", subscriptionId)
    .maybeSingle();

  if (subErr || !sub) {
    return { ok: false, error: subErr?.message || "Subscription not found" };
  }

  const pid = pharmacyId || sub.pharmacy_id;

  await admin
    .from("subscriptions")
    .update({ is_active: false })
    .eq("pharmacy_id", pid)
    .neq("id", subscriptionId);

  const { error: activateErr } = await admin
    .from("subscriptions")
    .update({
      is_active: true,
      payment_method: "polar",
      payment_reference: polarCheckoutId ?? null,
    })
    .eq("id", subscriptionId);

  if (activateErr) {
    return { ok: false, error: activateErr.message };
  }

  let planEnum: "trial" | "standard" | "premium" = "standard";
  if (meta.plan_name) {
    const n = meta.plan_name.toLowerCase();
    if (n.includes("premium")) planEnum = "premium";
    else if (n.includes("standard")) planEnum = "standard";
    else if (n.includes("free")) planEnum = "trial";
  }

  await admin
    .from("pharmacies")
    .update({
      subscription_plan: planEnum,
      subscription_expires_at: sub.expires_at,
      status: "active",
    })
    .eq("id", pid);

  if (polarCheckoutId) {
    await admin
      .from("payment_transactions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        payment_provider: "polar",
      })
      .eq("polar_checkout_id", polarCheckoutId);

    const { data: paidTx } = await admin
      .from("payment_transactions")
      .select("id")
      .eq("polar_checkout_id", polarCheckoutId)
      .maybeSingle();

    if (paidTx?.id) {
      await recordSubscriptionPayment(admin, paidTx.id as string);
    }
  }

  return { ok: true };
}
