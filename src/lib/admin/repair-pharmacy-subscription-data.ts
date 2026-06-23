import { prisma } from "@/lib/db/prisma";
import { resolvePharmacyEntitlements } from "@/lib/subscription/lifecycle/entitlements";
import { syncPharmacySubscriptionProjection } from "@/lib/subscription/lifecycle/pharmacy-projection";
import { isMainTierCatalogRow } from "@/lib/subscription/normalize-plan";

export type PharmacyDataRepairResult = {
  pharmaciesSynced: number;
  duplicateSubsCancelled: number;
  stalePendingCancelled: number;
  trialStatusNormalized: number;
  branchAddonReclassified: number;
};

/**
 * Re-sync pharmacy denormalized fields from subscriptions + entitlements.
 * Cancels duplicate active main subs and stale pending checkouts first.
 */
export async function repairPharmacySubscriptionData(): Promise<PharmacyDataRepairResult> {
  const result: PharmacyDataRepairResult = {
    pharmaciesSynced: 0,
    duplicateSubsCancelled: 0,
    stalePendingCancelled: 0,
    trialStatusNormalized: 0,
    branchAddonReclassified: 0,
  };

  const activeMainSubs = await prisma.subscriptions.findMany({
    where: {
      subscription_type: "main",
      status: { in: ["active", "pending", "pending_payment"] },
    },
    select: {
      id: true,
      subscription_plans_subscriptions_plan_idTosubscription_plans: {
        select: { name: true, plan_type: true },
      },
    },
  });

  const reclassifyIds: string[] = [];
  for (const row of activeMainSubs) {
    const embedded =
      row.subscription_plans_subscriptions_plan_idTosubscription_plans;
    if (!embedded || isMainTierCatalogRow(embedded)) continue;
    reclassifyIds.push(row.id);
  }
  if (reclassifyIds.length > 0) {
    const update = await prisma.subscriptions.updateMany({
      where: { id: { in: reclassifyIds } },
      data: {
        subscription_type: "branch_addon",
        updated_at: new Date(),
      },
    });
    result.branchAddonReclassified = update.count;
  }

  const activeMain = await prisma.subscriptions.findMany({
    where: {
      subscription_type: "main",
      status: "active",
      is_active: true,
    },
    select: {
      id: true,
      pharmacy_id: true,
      created_at: true,
      current_period_start: true,
      start_date: true,
    },
  });

  const byPharmacy = new Map<string, typeof activeMain>();
  for (const row of activeMain) {
    const pid = row.pharmacy_id;
    if (!pid) continue;
    const list = byPharmacy.get(pid) ?? [];
    list.push(row);
    byPharmacy.set(pid, list);
  }

  for (const [, rows] of Array.from(byPharmacy.entries())) {
    if (rows.length <= 1) continue;
    const sorted = [...rows].sort((a, b) => {
      const ta = (
        a.current_period_start ??
        a.start_date ??
        a.created_at ??
        new Date(0)
      ).getTime();
      const tb = (
        b.current_period_start ??
        b.start_date ??
        b.created_at ??
        new Date(0)
      ).getTime();
      return tb - ta;
    });
    const cancelIds = sorted.slice(1).map((r) => r.id);
    if (cancelIds.length === 0) continue;
    const update = await prisma.subscriptions.updateMany({
      where: { id: { in: cancelIds } },
      data: {
        status: "cancelled",
        is_active: false,
        cancelled_at: new Date(),
      },
    });
    result.duplicateSubsCancelled += update.count;
  }

  const staleBefore = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const stalePending = await prisma.subscriptions.updateMany({
    where: {
      subscription_type: "main",
      status: { in: ["pending", "pending_payment"] },
      created_at: { lt: staleBefore },
    },
    data: {
      status: "cancelled",
      is_active: false,
      cancelled_at: new Date(),
    },
  });
  result.stalePendingCancelled = stalePending.count;

  const trialRows = await prisma.pharmacies.updateMany({
    where: { status: "trial" },
    data: { status: "active", updated_at: new Date() },
  });
  result.trialStatusNormalized = trialRows.count;

  const pharmacies = await prisma.pharmacies.findMany({
    select: { id: true },
  });
  for (const row of pharmacies) {
    try {
      const ent = await resolvePharmacyEntitlements(row.id);
      await syncPharmacySubscriptionProjection(row.id, {
        plan: ent.effectivePlan,
        expiresAt: ent.expiresAt,
        accessAllowed: ent.isAccessAllowed,
      });
      result.pharmaciesSynced += 1;
    } catch (e) {
      console.warn("[repairPharmacySubscriptionData]", row.id, e);
    }
  }

  return result;
}
