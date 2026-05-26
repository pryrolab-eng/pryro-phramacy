import type { SupabaseClient } from "@supabase/supabase-js";
import {
  comparePlanRows,
  findDuplicatePlanGroups,
} from "./dedupe-plans";
import { canonicalPlanName } from "./plan-name-validation";

export type DedupePlansDbResult = {
  deactivated: number;
  subscriptionsRepointed: number;
  groups: Array<{ name: string; keeperId: string; duplicateIds: string[] }>;
};

/**
 * Deactivate duplicate subscription_plans (same name), keep one canonical row,
 * repoint subscriptions.plan_id to the keeper, and merge polar_product_id when missing.
 */
export async function dedupeSubscriptionPlansInDb(
  admin: SupabaseClient
): Promise<DedupePlansDbResult> {
  const { data: plans, error } = await admin
    .from("subscription_plans")
    .select(
      "id, name, plan_type, price, polar_product_id, is_active, updated_at, created_at"
    );

  if (error) throw error;

  const groups = findDuplicatePlanGroups(plans ?? [], { activeOnly: true });
  if (groups.length === 0) {
    return { deactivated: 0, subscriptionsRepointed: 0, groups: [] };
  }

  let deactivated = 0;
  let subscriptionsRepointed = 0;

  for (const group of groups) {
    const [groupName, groupType] = group.name.split("::");
    const rows = (plans ?? []).filter(
      (p) =>
        p.is_active !== false &&
        canonicalPlanName(p.name) === groupName &&
        (String(p.plan_type ?? "main").trim().toLowerCase() === "branch_addon"
          ? "branch_addon"
          : "main") === (groupType === "branch_addon" ? "branch_addon" : "main")
    );
    rows.sort(comparePlanRows);
    const keeper = rows[0];
    const duplicates = rows.slice(1);
    if (!keeper || duplicates.length === 0) continue;

    const keeperPolar = keeper.polar_product_id as string | null | undefined;
    for (const dup of duplicates) {
      if (!keeperPolar && dup.polar_product_id) {
        await admin
          .from("subscription_plans")
          .update({ polar_product_id: dup.polar_product_id })
          .eq("id", keeper.id);
      }

      const { error: subErr } = await admin
        .from("subscriptions")
        .update({ plan_id: keeper.id })
        .eq("plan_id", dup.id);

      if (subErr) {
        if (!subErr.message.includes("plan_id")) {
          console.warn("dedupe: subscriptions repoint", dup.id, subErr.message);
        }
      } else {
        subscriptionsRepointed += 1;
      }

      const { error: offErr } = await admin
        .from("subscription_plans")
        .update({ is_active: false })
        .eq("id", dup.id);

      if (offErr) {
        console.warn("dedupe: deactivate plan", dup.id, offErr.message);
      } else {
        deactivated += 1;
      }
    }
  }

  return {
    deactivated,
    subscriptionsRepointed,
    groups: groups.map((g) => ({
      name: g.name,
      keeperId: g.keeperId,
      duplicateIds: g.duplicateIds,
    })),
  };
}
