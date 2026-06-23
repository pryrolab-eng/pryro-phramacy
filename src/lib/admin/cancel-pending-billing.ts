import { prisma } from "@/lib/db/prisma";
import { syncPharmacySubscriptionProjection } from "@/lib/subscription/lifecycle/pharmacy-projection";
import { resolvePharmacyEntitlements } from "@/lib/subscription/lifecycle/entitlements";

const PENDING_TX_STATUSES = ["pending", "processing"] as const;
const PENDING_SUB_STATUSES = ["pending_payment", "pending"] as const;

export function getPendingPaymentMaxAgeDays(): number {
  const raw = Number(process.env.PENDING_PAYMENT_EXPIRE_DAYS ?? 7);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 7;
}

async function syncPharmacyAfterCancel(pharmacyId: string): Promise<void> {
  const ent = await resolvePharmacyEntitlements(pharmacyId);
  await syncPharmacySubscriptionProjection(pharmacyId, {
    plan: ent.effectivePlan,
    expiresAt: ent.expiresAt,
    accessAllowed: ent.isAccessAllowed,
  });
}

/** Cancel a single pending/processing payment transaction. */
export async function cancelPaymentTransaction(
  paymentTransactionId: string,
): Promise<{ ok: boolean; error?: string }> {
  const tx = await prisma.payment_transactions.findUnique({
    where: { id: paymentTransactionId },
    select: { id: true, status: true, pharmacy_id: true },
  });

  if (!tx) {
    return { ok: false, error: "Payment not found" };
  }

  const status = String(tx.status ?? "");
  if (!PENDING_TX_STATUSES.includes(status as (typeof PENDING_TX_STATUSES)[number])) {
    return { ok: false, error: `Payment is ${status}; only pending can be cancelled` };
  }

  await prisma.payment_transactions.update({
    where: { id: paymentTransactionId },
    data: {
      status: "cancelled",
      error_message: "Cancelled by platform admin",
      updated_at: new Date(),
    },
  });

  return { ok: true };
}

/** Cancel pending main (and branch) subscriptions for a pharmacy. */
export async function cancelPendingSubscriptionsForPharmacy(
  pharmacyId: string,
): Promise<{ cancelled: number; error?: string }> {
  const rows = await prisma.subscriptions.findMany({
    where: {
      pharmacy_id: pharmacyId,
      status: { in: [...PENDING_SUB_STATUSES] },
    },
    select: { id: true },
  });

  const ids = rows.map((row) => row.id);
  if (ids.length === 0) {
    return { cancelled: 0 };
  }

  const now = new Date();
  await prisma.subscriptions.updateMany({
    where: { id: { in: ids } },
    data: {
      status: "cancelled",
      is_active: false,
      payment_method: "cancelled",
      cancelled_at: now,
    },
  });

  await prisma.payment_transactions.updateMany({
    where: {
      pharmacy_id: pharmacyId,
      status: { in: [...PENDING_TX_STATUSES] },
    },
    data: {
      status: "cancelled",
      error_message: "Cancelled with pending subscription",
      updated_at: now,
    },
  });

  await syncPharmacyAfterCancel(pharmacyId);
  return { cancelled: ids.length };
}

export async function cancelPendingSubscriptionById(
  subscriptionId: string,
): Promise<{ ok: boolean; error?: string }> {
  const sub = await prisma.subscriptions.findUnique({
    where: { id: subscriptionId },
    select: { id: true, pharmacy_id: true, status: true },
  });

  if (!sub?.pharmacy_id) {
    return { ok: false, error: "Subscription not found" };
  }

  const status = String(sub.status ?? "");
  if (!PENDING_SUB_STATUSES.includes(status as (typeof PENDING_SUB_STATUSES)[number])) {
    return { ok: false, error: `Subscription is ${status}; only pending can be cancelled` };
  }

  const now = new Date();
  await prisma.subscriptions.update({
    where: { id: subscriptionId },
    data: {
      status: "cancelled",
      is_active: false,
      payment_method: "cancelled",
      cancelled_at: now,
    },
  });

  await prisma.payment_transactions.updateMany({
    where: {
      subscription_id: subscriptionId,
      status: { in: [...PENDING_TX_STATUSES] },
    },
    data: {
      status: "cancelled",
      updated_at: now,
    },
  });

  await syncPharmacyAfterCancel(sub.pharmacy_id);
  return { ok: true };
}

/** Cron: cancel stale pending payments and subscriptions older than maxAgeDays. */
export async function expireStalePendingPayments(
  maxAgeDays = getPendingPaymentMaxAgeDays(),
): Promise<{
  paymentsCancelled: number;
  subscriptionsCancelled: number;
  pharmacyIds: string[];
}> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxAgeDays);

  const pharmacyIds = new Set<string>();
  let paymentsCancelled = 0;
  let subscriptionsCancelled = 0;

  const staleTx = await prisma.payment_transactions.findMany({
    where: {
      status: { in: [...PENDING_TX_STATUSES] },
      created_at: { lt: cutoff },
    },
    select: { id: true, pharmacy_id: true },
  });

  for (const tx of staleTx) {
    const res = await cancelPaymentTransaction(tx.id);
    if (res.ok) {
      paymentsCancelled++;
      if (tx.pharmacy_id) pharmacyIds.add(tx.pharmacy_id);
    }
  }

  const staleSubs = await prisma.subscriptions.findMany({
    where: {
      status: { in: [...PENDING_SUB_STATUSES] },
      created_at: { lt: cutoff },
    },
    select: { id: true, pharmacy_id: true },
  });

  for (const sub of staleSubs) {
    if (!sub.pharmacy_id) continue;
    const res = await cancelPendingSubscriptionById(sub.id);
    if (res.ok) {
      subscriptionsCancelled++;
      pharmacyIds.add(sub.pharmacy_id);
    }
  }

  return {
    paymentsCancelled,
    subscriptionsCancelled,
    pharmacyIds: Array.from(pharmacyIds),
  };
}
