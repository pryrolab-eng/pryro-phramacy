import type { SupabaseClient } from "@supabase/supabase-js";
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

export async function getPlanLimitsForPharmacy(
  admin: SupabaseClient,
  pharmacyId: string
): Promise<PlanLimits> {
  const ent = await resolvePharmacyEntitlements(admin, pharmacyId);
  const plan = ent.effectivePlan;

  if (!plan) {
    return { maxUsers: DEFAULT_MAX_USERS, maxBranches: DEFAULT_MAX_BRANCHES };
  }

  return {
    maxUsers: Number(plan.max_users ?? DEFAULT_MAX_USERS),
    maxBranches: Number(plan.max_branches ?? DEFAULT_MAX_BRANCHES),
  };
}

export async function getPharmacyUsage(
  admin: SupabaseClient,
  pharmacyId: string
): Promise<PharmacyUsage> {
  const [{ count: users }, { count: branches }] = await Promise.all([
    admin
      .from("pharmacy_users")
      .select("id", { count: "exact", head: true })
      .eq("pharmacy_id", pharmacyId)
      .eq("is_active", true),
    admin
      .from("branches")
      .select("id", { count: "exact", head: true })
      .eq("pharmacy_id", pharmacyId)
      .eq("is_active", true),
  ]);

  return {
    activeUsers: users ?? 0,
    activeBranches: branches ?? 0,
  };
}

export async function canAddPharmacyUser(
  admin: SupabaseClient,
  pharmacyId: string
): Promise<CanAddUserResult> {
  const [limits, usage] = await Promise.all([
    getPlanLimitsForPharmacy(admin, pharmacyId),
    getPharmacyUsage(admin, pharmacyId),
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
