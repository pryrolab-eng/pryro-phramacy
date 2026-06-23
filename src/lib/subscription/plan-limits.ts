import { storeCountPharmacyUsage } from "@/lib/db/pharmacy-usage-store";
import { resolvePharmacyEntitlements } from "./lifecycle/entitlements";

const DEFAULT_MAX_USERS = 5;
const DEFAULT_MAX_BRANCHES = 1;

export type PlanLimits = {
  maxUsers: number;
  maxBranches: number;
};

export type PharmacyUsage = {
  activeUsers: number;
  activeBranches: number;
};

export type CanAddUserResult = {
  allowed: boolean;
  reason?: string;
  current: number;
  limit: number;
  overLimit: boolean;
};

export async function getPlanLimitsForPharmacy(pharmacyId: string): Promise<PlanLimits> {
  const ent = await resolvePharmacyEntitlements(pharmacyId);
  const plan = ent.effectivePlan;

  if (!plan) {
    return { maxUsers: DEFAULT_MAX_USERS, maxBranches: DEFAULT_MAX_BRANCHES };
  }

  return {
    maxUsers: Number(plan.max_users ?? DEFAULT_MAX_USERS),
    maxBranches: Number(plan.max_branches ?? DEFAULT_MAX_BRANCHES),
  };
}

export async function getPharmacyUsage(pharmacyId: string): Promise<PharmacyUsage> {
  return storeCountPharmacyUsage(pharmacyId);
}

export async function canAddPharmacyUser(pharmacyId: string): Promise<CanAddUserResult> {
  const [limits, usage] = await Promise.all([
    getPlanLimitsForPharmacy(pharmacyId),
    getPharmacyUsage(pharmacyId),
  ]);

  const overLimit = usage.activeUsers > limits.maxUsers;

  if (usage.activeUsers >= limits.maxUsers) {
    return {
      allowed: false,
      reason: overLimit
        ? "You are above your plan user limit. Remove users before adding more."
        : `Your plan allows up to ${limits.maxUsers} users. Remove a user or upgrade to add more.`,
      current: usage.activeUsers,
      limit: limits.maxUsers,
      overLimit,
    };
  }

  return {
    allowed: true,
    current: usage.activeUsers,
    limit: limits.maxUsers,
    overLimit,
  };
}
