import type { SupabaseClient } from "@supabase/supabase-js";
import { syncPharmacySubscriptionProjection } from "@/lib/subscription/lifecycle/pharmacy-projection";
import { resolvePharmacyEntitlements } from "@/lib/subscription/lifecycle/entitlements";

const PENDING_TX_STATUSES = ["pending", "processing"] as const;
const PENDING_SUB_STATUSES = ["pending_payment", "pending"] as const;

export function getPendingPaymentMaxAgeDays(): number {
  const raw = Number(process.env.PENDING_PAYMENT_EXPIRE_DAYS ?? 7);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 7;
}

async function syncPharmacyAfterCancel(
  admin: SupabaseClient,
  pharmacyId: string,
): Promise<void> {
  const ent = await resolvePharmacyEntitlements(admin, pharmacyId);
  await syncPharmacySubscriptionProjection(admin, pharmacyId, {
    plan: ent.effectivePlan,
    expiresAt: ent.expiresAt,
    accessAllowed: ent.isAccessAllowed,
  });
}

/** Cancel a single pending/processing payment transaction. */
export async function cancelPaymentTransaction(
  admin: SupabaseClient,
  paymentTransactionId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data: tx, error: loadErr } = await admin
    .from("payment_transactions")
    .select("id, status, pharmacy_id")
    .eq("id", paymentTransactionId)
    .maybeSingle();

  if (loadErr || !tx) {
    return { ok: false, error: loadErr?.message ?? "Payment not found" };
  }

  const status = String(tx.status ?? "");
  if (!PENDING_TX_STATUSES.includes(status as (typeof PENDING_TX_STATUSES)[number])) {
    return { ok: false, error: `Payment is ${status}; only pending can be cancelled` };
  }

  const { error } = await admin
    .from("payment_transactions")
    .update({
      status: "cancelled",
      error_message: "Cancelled by platform admin",
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentTransactionId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Cancel pending main (and branch) subscriptions for a pharmacy. */
export async function cancelPendingSubscriptionsForPharmacy(
  admin: SupabaseClient,
  pharmacyId: string,
): Promise<{ cancelled: number; error?: string }> {
  const { data: rows, error: loadErr } = await admin
    .from("subscriptions")
    .select("id")
    .eq("pharmacy_id", pharmacyId)
    .in("status", [...PENDING_SUB_STATUSES]);

  if (loadErr) return { cancelled: 0, error: loadErr.message };

  const ids = (rows ?? []).map((r) => (r as { id: string }).id);
  if (ids.length === 0) {
    return { cancelled: 0 };
  }

  const now = new Date().toISOString();
  const { error } = await admin
    .from("subscriptions")
    .update({
      status: "cancelled",
      is_active: false,
      payment_method: "cancelled",
      cancelled_at: now,
    })
    .in("id", ids);

  if (error) return { cancelled: 0, error: error.message };

  await admin
    .from("payment_transactions")
    .update({
      status: "cancelled",
      error_message: "Cancelled with pending subscription",
      updated_at: now,
    })
    .eq("pharmacy_id", pharmacyId)
    .in("status", [...PENDING_TX_STATUSES]);

  await syncPharmacyAfterCancel(admin, pharmacyId);
  return { cancelled: ids.length };
}

export async function cancelPendingSubscriptionById(
  admin: SupabaseClient,
  subscriptionId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data: sub, error: loadErr } = await admin
    .from("subscriptions")
    .select("id, pharmacy_id, status")
    .eq("id", subscriptionId)
    .maybeSingle();

  if (loadErr || !sub) {
    return { ok: false, error: loadErr?.message ?? "Subscription not found" };
  }

  const status = String(sub.status ?? "");
  if (!PENDING_SUB_STATUSES.includes(status as (typeof PENDING_SUB_STATUSES)[number])) {
    return { ok: false, error: `Subscription is ${status}; only pending can be cancelled` };
  }

  const pharmacyId = sub.pharmacy_id as string;
  const now = new Date().toISOString();

  const { error } = await admin
    .from("subscriptions")
    .update({
      status: "cancelled",
      is_active: false,
      payment_method: "cancelled",
      cancelled_at: now,
    })
    .eq("id", subscriptionId);

  if (error) return { ok: false, error: error.message };

  await admin
    .from("payment_transactions")
    .update({
      status: "cancelled",
      updated_at: now,
    })
    .eq("subscription_id", subscriptionId)
    .in("status", [...PENDING_TX_STATUSES]);

  await syncPharmacyAfterCancel(admin, pharmacyId);
  return { ok: true };
}

/** Cron: cancel stale pending payments and subscriptions older than maxAgeDays. */
export async function expireStalePendingPayments(
  admin: SupabaseClient,
  maxAgeDays = getPendingPaymentMaxAgeDays(),
): Promise<{
  paymentsCancelled: number;
  subscriptionsCancelled: number;
  pharmacyIds: string[];
}> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxAgeDays);
  const cutoffIso = cutoff.toISOString();

  const pharmacyIds = new Set<string>();
  let paymentsCancelled = 0;
  let subscriptionsCancelled = 0;

  const { data: staleTx } = await admin
    .from("payment_transactions")
    .select("id, pharmacy_id")
    .in("status", [...PENDING_TX_STATUSES])
    .lt("created_at", cutoffIso);

  for (const tx of staleTx ?? []) {
    const id = (tx as { id: string }).id;
    const phId = (tx as { pharmacy_id?: string }).pharmacy_id;
    const res = await cancelPaymentTransaction(admin, id);
    if (res.ok) {
      paymentsCancelled++;
      if (phId) pharmacyIds.add(phId);
    }
  }

  const { data: staleSubs } = await admin
    .from("subscriptions")
    .select("id, pharmacy_id")
    .in("status", [...PENDING_SUB_STATUSES])
    .lt("created_at", cutoffIso);

  for (const sub of staleSubs ?? []) {
    const id = (sub as { id: string }).id;
    const phId = (sub as { pharmacy_id: string }).pharmacy_id;
    const res = await cancelPendingSubscriptionById(admin, id);
    if (res.ok) {
      subscriptionsCancelled++;
      pharmacyIds.add(phId);
    }
  }

  return {
    paymentsCancelled,
    subscriptionsCancelled,
    pharmacyIds: Array.from(pharmacyIds),
  };
}
