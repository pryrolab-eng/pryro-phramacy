import type { SupabaseClient } from "@supabase/supabase-js";
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
export async function fixSubscriptionPlanCatalogTypes(
  admin: SupabaseClient
): Promise<FixCatalogTypesResult> {
  const { data: plans, error } = await admin
    .from("subscription_plans")
    .select("id, name, plan_type");

  if (error) throw error;

  let mainPlansFixed = 0;
  let addonsFixed = 0;

  for (const row of plans ?? []) {
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

    const { error: updateErr } = await admin
      .from("subscription_plans")
      .update({ plan_type: next })
      .eq("id", row.id);

    if (updateErr) throw updateErr;

    if (next === "main") mainPlansFixed++;
    else addonsFixed++;
  }

  return { mainPlansFixed, addonsFixed };
}
