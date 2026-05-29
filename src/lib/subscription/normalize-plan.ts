import { normalizePlanPeriodLabel } from "./plan-period";

export type PlanType = "main" | "branch_addon";

/** Catalog names that must never be sold as branch add-ons. */
const MAIN_TIER_PLAN_NAMES = new Set([
  "standard",
  "premium",
  "starter",
  "stater",
  "basic",
  "free",
  "trial",
]);

/** Names reserved for per-branch add-on products. */
const BRANCH_ADDON_PLAN_NAMES = new Set([
  "branch add-on",
  "branch addon",
  "branch_addon",
  "extra branch",
]);

export function normalizePlanNameForCatalog(name: string): string {
  return String(name ?? "").trim().toLowerCase();
}

/** True for per-branch products — never a pharmacy's main subscription tier. */
export function isBranchAddonCatalogName(name: string | null | undefined): boolean {
  const key = normalizePlanNameForCatalog(String(name ?? ""));
  return BRANCH_ADDON_PLAN_NAMES.has(key) || key.includes("branch add");
}

export function isMainTierCatalogRow(row: {
  name?: string | null;
  plan_type?: string | null;
}): boolean {
  const planType = String(row.plan_type ?? "main").trim().toLowerCase();
  if (planType === "branch_addon") return false;
  if (isBranchAddonCatalogName(row.name)) return false;
  return true;
}

export type DisplaySubscriptionPlan = {
  id: string;
  name: string;
  price: number;
  period: string;
  billing_period?: string;
  features: string[];
  is_popular: boolean;
  plan_type: PlanType;
  monthly_tx_limit: number;
  max_users?: number;
  max_branches?: number;
};

export function planTypeFromRow(row: Record<string, unknown>): PlanType {
  const raw = String(row.plan_type ?? "main").trim().toLowerCase();
  const fromDb: PlanType = raw === "branch_addon" ? "branch_addon" : "main";
  const nameKey = normalizePlanNameForCatalog(String(row.name ?? ""));

  if (fromDb === "branch_addon" && MAIN_TIER_PLAN_NAMES.has(nameKey)) {
    return "main";
  }
  if (fromDb === "main" && BRANCH_ADDON_PLAN_NAMES.has(nameKey)) {
    return "branch_addon";
  }
  return fromDb;
}

/** Normalize a subscription_plans row from Supabase for UI display. */
export function normalizeSubscriptionPlanRow(
  row: Record<string, unknown>
): DisplaySubscriptionPlan {
  const rawFeatures = row.features;
  let features: string[] = [];
  if (Array.isArray(rawFeatures)) {
    features = rawFeatures.map((f) => String(f));
  } else if (typeof rawFeatures === "string") {
    try {
      const parsed = JSON.parse(rawFeatures) as unknown;
      features = Array.isArray(parsed)
        ? parsed.map((f) => String(f))
        : rawFeatures
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean);
    } catch {
      features = rawFeatures
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);
    }
  }

  const price = Number(row.price ?? 0);
  const billing_period = String(row.billing_period ?? "monthly");

  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    price,
    billing_period,
    period: normalizePlanPeriodLabel(
      String(row.period ?? "per month"),
      billing_period,
      price,
    ),
    features,
    is_popular: Boolean(row.is_popular),
    plan_type: planTypeFromRow(row),
    monthly_tx_limit: Number(row.monthly_tx_limit ?? 0),
    max_users: row.max_users !== undefined ? Number(row.max_users) : undefined,
    max_branches: row.max_branches !== undefined ? Number(row.max_branches) : undefined,
  };
}

export function parsePlanPriceInput(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}
