import { prisma } from "@/lib/db/prisma";
import { normalizePlanNameForCatalog } from "./normalize-plan";

export type FixCatalogTypesResult = {
  mainPlansFixed: number;
  addonsFixed: number;
};

const MAIN_TIER_NAMES = new Set([
  "standard",
  "premium",
  "starter",
  "stater",
  "basic",
  "free",
  "trial",
]);

const BRANCH_ADDON_NAMES = new Set([
  "branch add-on",
  "branch addon",
  "branch_addon",
  "extra branch",
]);

/** Correct common mis-typed plan_type values in subscription_plans. */
export async function fixSubscriptionPlanCatalogTypes(): Promise<FixCatalogTypesResult> {
  const plans = await prisma.subscription_plans.findMany({
    select: { id: true, name: true, plan_type: true },
  });

  let mainPlansFixed = 0;
  let addonsFixed = 0;

  for (const row of plans) {
    const nameKey = normalizePlanNameForCatalog(String(row.name ?? ""));
    const current =
      String(row.plan_type ?? "main").trim().toLowerCase() === "branch_addon"
        ? "branch_addon"
        : "main";

    let next: "main" | "branch_addon" | null = null;
    if (MAIN_TIER_NAMES.has(nameKey) && current === "branch_addon") {
      next = "main";
    } else if (BRANCH_ADDON_NAMES.has(nameKey) && current !== "branch_addon") {
      next = "branch_addon";
    }

    if (!next) continue;

    await prisma.subscription_plans.update({
      where: { id: row.id },
      data: { plan_type: next },
    });

    if (next === "main") mainPlansFixed++;
    else addonsFixed++;
  }

  return { mainPlansFixed, addonsFixed };
}
