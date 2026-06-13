import { isEntitlementsEnforced } from "../feature-catalog";
import {
  type EntitlementLimits,
  type EntitlementPlan,
  type EntitlementUsage,
  type PharmacyEntitlements,
} from "./types";
import { getWithinLimitBlockReason } from "@/lib/subscription/access-block";

export const DEFAULT_MAX_USERS = 5;
export const DEFAULT_MAX_BRANCHES = 1;
export const DEFAULT_MONTHLY_TX = 500;

export type MainSubscriptionRow = {
  id: string;
  pharmacy_id: string;
  plan_id: string | null;
  plan: string;
  status: string | null;
  is_active: boolean | null;
  expires_at: string | null;
  payment_method: string | null;
  next_plan_id: string | null;
  change_scheduled_at: string | null;
  change_type: string | null;
  pending_change_status: string | null;
  subscription_plans?: EntitlementPlan | EntitlementPlan[] | null;
};

export function resolveJoinedPlan(row: MainSubscriptionRow): EntitlementPlan | null {
  const joined = row.subscription_plans;
  if (!joined) return null;
  const plan = Array.isArray(joined) ? joined[0] : joined;
  if (!plan?.id && !plan?.name) return null;
  return {
    id: plan.id,
    name: String(plan.name),
    price: Number(plan.price ?? 0),
    period: plan.period ?? null,
    max_users: plan.max_users,
    max_branches: plan.max_branches,
    monthly_tx_limit: plan.monthly_tx_limit,
  };
}

export function buildLimits(
  plan: EntitlementPlan | null,
  totalBranchSlots: number,
): EntitlementLimits {
  return {
    maxUsers: Number(plan?.max_users ?? DEFAULT_MAX_USERS),
    maxBranches: Number(plan?.max_branches ?? DEFAULT_MAX_BRANCHES),
    monthlyTxPerBranch: Number(plan?.monthly_tx_limit ?? DEFAULT_MONTHLY_TX),
    totalBranchSlots,
  };
}

export function buildEntitlementHelpers(
  featureKeys: string[],
  limits: EntitlementLimits,
  usage: EntitlementUsage,
  isAccessAllowed: boolean,
  accessBlockReason: PharmacyEntitlements["accessBlockReason"],
): Pick<PharmacyEntitlements, "can" | "withinLimit"> {
  const keySet = new Set(featureKeys);
  const enforced = isEntitlementsEnforced();
  const blockedReason = getWithinLimitBlockReason(accessBlockReason);

  return {
    can(featureKey: string) {
      if (!enforced) return isAccessAllowed;
      if (!isAccessAllowed) return false;
      return keySet.has(featureKey);
    },
    withinLimit(limitKey: "users" | "branches" | "transactions") {
      if (!enforced) {
        return { allowed: true, current: 0, limit: 0 };
      }
      if (!isAccessAllowed) {
        return {
          allowed: false,
          reason: blockedReason,
          current: 0,
          limit: 0,
        };
      }
      if (limitKey === "users") {
        const current = usage.activeUsers;
        const limit = limits.maxUsers;
        if (current >= limit) {
          return {
            allowed: false,
            reason: `Your plan allows up to ${limit} users.`,
            current,
            limit,
          };
        }
        return { allowed: true, current, limit };
      }
      if (limitKey === "branches") {
        const current = usage.activeBranches;
        const limit = limits.totalBranchSlots;
        if (current >= limit) {
          return {
            allowed: false,
            reason: `Your plan allows up to ${limit} branches.`,
            current,
            limit,
          };
        }
        return { allowed: true, current, limit };
      }
      return { allowed: true, current: 0, limit: limits.monthlyTxPerBranch };
    },
  };
}

export function emptyEntitlements(
  pharmacyId: string,
  pharmacyStatus: string,
  accessBlockReason: PharmacyEntitlements["accessBlockReason"],
): PharmacyEntitlements {
  const limits = buildLimits(null, DEFAULT_MAX_BRANCHES);
  const usage: EntitlementUsage = { activeUsers: 0, activeBranches: 0 };
  const isAccessAllowed = accessBlockReason === "none";
  const helpers = buildEntitlementHelpers(
    [],
    limits,
    usage,
    isAccessAllowed,
    accessBlockReason,
  );
  return {
    pharmacyId,
    pharmacyStatus,
    effectivePlan: null,
    effectivePlanLabel: "standard",
    subscriptionId: null,
    lifecycleStatus: null,
    expiresAt: null,
    isAccessAllowed,
    accessBlockReason,
    isExpired: true,
    daysRemaining: null,
    scheduledChange: null,
    featureKeys: [],
    limits,
    usage,
    ...helpers,
  };
}
