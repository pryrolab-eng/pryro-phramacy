import { PHARMACY_GRACE_ROUTES } from "@/lib/routes/pharmacy-paths";

/** Required boolean features for sellable main plans. */
export const REQUIRED_MAIN_PLAN_FEATURE_KEYS = [
  "app.dashboard",
  "pos.access",
] as const;

export const LIMIT_FEATURE_KEYS = {
  users: "limit.users",
  branches: "limit.branches",
  transactions: "limit.transactions_per_branch",
} as const;

export type LimitFeatureKey = keyof typeof LIMIT_FEATURE_KEYS;

export const LIMIT_COLUMN_BY_KEY: Record<string, string> = {
  [LIMIT_FEATURE_KEYS.users]: "max_users",
  [LIMIT_FEATURE_KEYS.branches]: "max_branches",
  [LIMIT_FEATURE_KEYS.transactions]: "monthly_tx_limit",
};

/** Routes always reachable for per-feature checks when subscription is active. */
export const ALWAYS_ALLOWED_ROUTES = [
  ...PHARMACY_GRACE_ROUTES,
  "/sign-in",
  "/sign-out",
];

export function isEntitlementsEnforced(): boolean {
  const flag = process.env.ENTITLEMENTS_ENFORCE;
  if (flag === "false" || flag === "0") return false;
  return true;
}
