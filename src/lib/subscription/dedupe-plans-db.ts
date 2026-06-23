import { prisma } from "@/lib/db/prisma";
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
export async function dedupeSubscriptionPlansInDb(): Promise<DedupePlansDbResult> {
  const plans = await prisma.subscription_plans.findMany({
    select: {
      id: true,
      name: true,
      plan_type: true,
      price: true,
      polar_product_id: true,
      is_active: true,
      updated_at: true,
      created_at: true,
    },
  });

  const planRows = plans.map((p) => ({
    id: p.id,
    name: p.name,
    plan_type: p.plan_type,
    price: Number(p.price),
    polar_product_id: p.polar_product_id,
    is_active: p.is_active,
    updated_at: p.updated_at?.toISOString() ?? null,
    created_at: p.created_at?.toISOString() ?? null,
  }));

  const groups = findDuplicatePlanGroups(planRows, { activeOnly: true });
  if (groups.length === 0) {
    return { deactivated: 0, subscriptionsRepointed: 0, groups: [] };
  }

  let deactivated = 0;
  let subscriptionsRepointed = 0;

  for (const group of groups) {
    const [groupName, groupType] = group.name.split("::");
    const rows = planRows.filter(
      (p) =>
        p.is_active !== false &&
        canonicalPlanName(p.name) === groupName &&
        (String(p.plan_type ?? "main").trim().toLowerCase() === "branch_addon"
          ? "branch_addon"
          : "main") === (groupType === "branch_addon" ? "branch_addon" : "main"),
    );
    rows.sort(comparePlanRows);
    const keeper = rows[0];
    const duplicates = rows.slice(1);
    if (!keeper || duplicates.length === 0) continue;

    const keeperPolar = keeper.polar_product_id;
    for (const dup of duplicates) {
      if (!keeperPolar && dup.polar_product_id) {
        await prisma.subscription_plans.update({
          where: { id: keeper.id },
          data: { polar_product_id: dup.polar_product_id },
        });
      }

      try {
        const result = await prisma.subscriptions.updateMany({
          where: { plan_id: dup.id },
          data: { plan_id: keeper.id },
        });
        if (result.count > 0) {
          subscriptionsRepointed += result.count;
        }
      } catch (subErr) {
        const msg = subErr instanceof Error ? subErr.message : String(subErr);
        if (!msg.includes("plan_id")) {
          console.warn("dedupe: subscriptions repoint", dup.id, msg);
        }
      }

      try {
        await prisma.subscription_plans.update({
          where: { id: dup.id },
          data: { is_active: false },
        });
        deactivated += 1;
      } catch (offErr) {
        const msg = offErr instanceof Error ? offErr.message : String(offErr);
        console.warn("dedupe: deactivate plan", dup.id, msg);
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
