import type { SupabaseClient } from "@supabase/supabase-js";
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
export async function repairPharmacySubscriptionData(
  admin: SupabaseClient,
): Promise<PharmacyDataRepairResult> {
  const result: PharmacyDataRepairResult = {
    pharmaciesSynced: 0,
    duplicateSubsCancelled: 0,
    stalePendingCancelled: 0,
    trialStatusNormalized: 0,
    branchAddonReclassified: 0,
  };

  const { data: activeMainSubs } = await admin
    .from("subscriptions")
    .select(
      "id, subscription_plans!plan_id(name, plan_type)",
    )
    .eq("subscription_type", "main")
    .in("status", ["active", "pending", "pending_payment"]);

  const reclassifyIds: string[] = [];
  for (const row of activeMainSubs ?? []) {
    const embedded = (row as {
      subscription_plans?: { name?: string; plan_type?: string } | null;
    }).subscription_plans;
    if (!embedded || isMainTierCatalogRow(embedded)) continue;
    reclassifyIds.push(row.id as string);
  }
  if (reclassifyIds.length > 0) {
    const { error } = await admin
      .from("subscriptions")
      .update({
        subscription_type: "branch_addon",
        updated_at: new Date().toISOString(),
      })
      .in("id", reclassifyIds);
    if (!error) result.branchAddonReclassified = reclassifyIds.length;
  }

  const { data: activeMain } = await admin
    .from("subscriptions")
    .select("id, pharmacy_id, created_at, current_period_start, start_date")
    .eq("subscription_type", "main")
    .eq("status", "active")
    .eq("is_active", true);

  const byPharmacy = new Map<string, Array<Record<string, unknown>>>();
  for (const row of activeMain ?? []) {
    const pid = row.pharmacy_id as string | null;
    if (!pid) continue;
    const list = byPharmacy.get(pid) ?? [];
    list.push(row);
    byPharmacy.set(pid, list);
  }

  for (const [, rows] of Array.from(byPharmacy.entries())) {
    if (rows.length <= 1) continue;
    const sorted = [...rows].sort((a, b) => {
      const ta = new Date(
        (a.current_period_start as string) ||
          (a.start_date as string) ||
          (a.created_at as string) ||
          0,
      ).getTime();
      const tb = new Date(
        (b.current_period_start as string) ||
          (b.start_date as string) ||
          (b.created_at as string) ||
          0,
      ).getTime();
      return tb - ta;
    });
    const cancelIds = sorted.slice(1).map((r) => r.id as string);
    if (cancelIds.length === 0) continue;
    const { error } = await admin
      .from("subscriptions")
      .update({
        status: "cancelled",
        is_active: false,
        cancelled_at: new Date().toISOString(),
      })
      .in("id", cancelIds);
    if (!error) result.duplicateSubsCancelled += cancelIds.length;
  }

  const staleBefore = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: stalePending } = await admin
    .from("subscriptions")
    .update({
      status: "cancelled",
      is_active: false,
      cancelled_at: new Date().toISOString(),
    })
    .eq("subscription_type", "main")
    .in("status", ["pending", "pending_payment"])
    .lt("created_at", staleBefore)
    .select("id");
  result.stalePendingCancelled = stalePending?.length ?? 0;

  const { data: trialRows } = await admin
    .from("pharmacies")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("status", "trial")
    .select("id");
  result.trialStatusNormalized = trialRows?.length ?? 0;

  const { data: pharmacies } = await admin.from("pharmacies").select("id");
  for (const row of pharmacies ?? []) {
    const pharmacyId = row.id as string;
    try {
      const ent = await resolvePharmacyEntitlements(admin, pharmacyId);
      await syncPharmacySubscriptionProjection(admin, pharmacyId, {
        plan: ent.effectivePlan,
        expiresAt: ent.expiresAt,
        accessAllowed: ent.isAccessAllowed,
      });
      result.pharmaciesSynced += 1;
    } catch (e) {
      console.warn("[repairPharmacySubscriptionData]", pharmacyId, e);
    }
  }

  return result;
}
