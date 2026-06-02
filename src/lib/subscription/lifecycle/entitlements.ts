import type { SupabaseClient } from "@supabase/supabase-js";
import { getBranchCapacity } from "../branch-addon-capacity";
import { isEntitlementsEnforced } from "../feature-catalog";
import { loadPlanFeatureKeys, listPlatformFeatures } from "../plan-features";
import { SUBSCRIPTION_CURRENT_PLAN_EMBED } from "../embed-plan";
import {
  type EntitlementLimits,
  type EntitlementPlan,
  type EntitlementUsage,
  type PharmacyEntitlements,
  type PharmacyEntitlementsSnapshot,
  type ScheduledChangeInfo,
  type WithinLimitResult,
} from "./types";
import { isBranchAddonCatalogName } from "../normalize-plan";
import {
  getWithinLimitBlockReason,
  resolveAccessBlockReason,
} from "@/lib/subscription/access-block";
import { normalizeLifecycleStatus, statusGrantsAccess } from "./status";

const DEFAULT_MAX_USERS = 5;
const DEFAULT_MAX_BRANCHES = 1;
const DEFAULT_MONTHLY_TX = 500;

type MainSubscriptionRow = {
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

function resolveJoinedPlan(row: MainSubscriptionRow): EntitlementPlan | null {
  const joined = row.subscription_plans;
  if (!joined) return null;
  const plan = Array.isArray(joined) ? joined[0] : joined;
  if (!plan?.id && !(plan as EntitlementPlan).name) return null;
  const p = plan as EntitlementPlan;
  return {
    id: p.id,
    name: String(p.name),
    price: Number(p.price ?? 0),
    period: p.period ?? null,
    max_users: p.max_users,
    max_branches: p.max_branches,
    monthly_tx_limit: p.monthly_tx_limit,
  };
}

async function loadPlanById(
  admin: SupabaseClient,
  planId: string,
): Promise<EntitlementPlan | null> {
  const { data } = await admin
    .from("subscription_plans")
    .select("id, name, price, period, max_users, max_branches, monthly_tx_limit")
    .eq("id", planId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id as string,
    name: String(data.name),
    price: Number(data.price ?? 0),
    period: data.period as string | null,
    max_users: data.max_users as number | undefined,
    max_branches: data.max_branches as number | undefined,
    monthly_tx_limit: data.monthly_tx_limit as number | undefined,
  };
}

async function loadPharmacyStatus(
  admin: SupabaseClient,
  pharmacyId: string,
): Promise<string> {
  const { data } = await admin
    .from("pharmacies")
    .select("status")
    .eq("id", pharmacyId)
    .maybeSingle();
  return String(data?.status ?? "active").toLowerCase();
}

async function loadUsage(
  admin: SupabaseClient,
  pharmacyId: string,
): Promise<EntitlementUsage> {
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

function buildLimits(
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

function buildEntitlementHelpers(
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

function emptyEntitlements(
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

export async function resolvePharmacyEntitlements(
  admin: SupabaseClient,
  pharmacyId: string,
): Promise<PharmacyEntitlements> {
  const pharmacyStatus = await loadPharmacyStatus(admin, pharmacyId);

  const { data: rows, error } = await admin
    .from("subscriptions")
    .select(
      `
      id,
      pharmacy_id,
      plan_id,
      plan,
      status,
      is_active,
      expires_at,
      payment_method,
      next_plan_id,
      change_scheduled_at,
      change_type,
      pending_change_status,
      ${SUBSCRIPTION_CURRENT_PLAN_EMBED} (
        id, name, price, period, max_users, max_branches, monthly_tx_limit
      )
    `,
    )
    .eq("pharmacy_id", pharmacyId)
    .eq("subscription_type", "main")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const candidates = (rows ?? []) as MainSubscriptionRow[];
  const isMainTierSub = (r: MainSubscriptionRow) => {
    const joined = resolveJoinedPlan(r);
    if (joined && isBranchAddonCatalogName(joined.name)) return false;
    return true;
  };

  const main =
    candidates.find(
      (r) =>
        isMainTierSub(r) &&
        statusGrantsAccess(
          normalizeLifecycleStatus(r.status, {
            is_active: r.is_active,
            payment_method: r.payment_method,
            pending_change_status: r.pending_change_status,
          }),
        ),
    ) ??
    candidates.find((r) => r.is_active && isMainTierSub(r)) ??
    null;

  if (!main) {
    const accessBlockReason = resolveAccessBlockReason({
      pharmacyStatus,
      hasMainSubscription: false,
      lifecycleStatus: null,
      isExpired: true,
      subscriptionAccessAllowed: false,
    });
    return emptyEntitlements(pharmacyId, pharmacyStatus, accessBlockReason);
  }

  const lifecycleStatus = normalizeLifecycleStatus(main.status, {
    is_active: main.is_active,
    payment_method: main.payment_method,
    pending_change_status: main.pending_change_status,
  });

  let effectivePlan = resolveJoinedPlan(main);
  if (effectivePlan && isBranchAddonCatalogName(effectivePlan.name)) {
    effectivePlan = null;
  }
  if (!effectivePlan && main.plan_id) {
    effectivePlan = await loadPlanById(admin, main.plan_id);
    if (effectivePlan && isBranchAddonCatalogName(effectivePlan.name)) {
      effectivePlan = null;
    }
  }

  const expiresAt = main.expires_at;
  const now = Date.now();
  const isExpired = !expiresAt || new Date(expiresAt).getTime() <= now;
  const subscriptionAccessAllowed =
    statusGrantsAccess(lifecycleStatus) && !isExpired;
  const accessBlockReason = resolveAccessBlockReason({
    pharmacyStatus,
    hasMainSubscription: true,
    lifecycleStatus,
    isExpired,
    subscriptionAccessAllowed,
  });
  const isAccessAllowed = accessBlockReason === "none";

  let daysRemaining: number | null = null;
  if (expiresAt && !isExpired) {
    daysRemaining = Math.max(
      0,
      Math.ceil(
        (new Date(expiresAt).getTime() - now) / (1000 * 60 * 60 * 24),
      ),
    );
  }

  let scheduledChange: ScheduledChangeInfo | null = null;
  if (
    main.pending_change_status === "scheduled" &&
    main.next_plan_id &&
    main.change_scheduled_at
  ) {
    const targetPlan = await loadPlanById(admin, main.next_plan_id);
    if (targetPlan) {
      scheduledChange = {
        status: "scheduled",
        effectiveAt: main.change_scheduled_at,
        changeType: "downgrade",
        targetPlan,
        currentPlan: effectivePlan,
        subscriptionId: main.id,
      };
    }
  }

  const [usage, capacity, featureKeys] = await Promise.all([
    loadUsage(admin, pharmacyId),
    getBranchCapacity(admin, pharmacyId),
    effectivePlan?.id
      ? loadPlanFeatureKeys(admin, effectivePlan.id)
      : Promise.resolve([]),
  ]);

  const limits = buildLimits(effectivePlan, capacity.totalSlots);
  const helpers = buildEntitlementHelpers(
    featureKeys,
    limits,
    usage,
    isAccessAllowed,
    accessBlockReason,
  );

  return {
    pharmacyId,
    pharmacyStatus,
    effectivePlan,
    effectivePlanLabel: (effectivePlan?.name ?? main.plan ?? "standard")
      .toString()
      .toLowerCase(),
    subscriptionId: main.id,
    lifecycleStatus,
    expiresAt,
    isAccessAllowed,
    accessBlockReason,
    isExpired,
    daysRemaining,
    scheduledChange,
    featureKeys,
    limits,
    usage,
    ...helpers,
  };
}

let routeFeatureMapCache: Record<string, string> | null = null;

export async function getRouteFeatureMap(
  admin: SupabaseClient,
): Promise<Record<string, string>> {
  if (routeFeatureMapCache) return routeFeatureMapCache;
  const features = await listPlatformFeatures(admin);
  const map: Record<string, string> = {};
  for (const f of features) {
    if (f.feature_type !== "boolean") continue;
    for (const route of f.nav_routes) {
      if (route) map[route] = f.key;
    }
  }
  routeFeatureMapCache = map;
  return map;
}

export async function toEntitlementsSnapshot(
  admin: SupabaseClient,
  ent: PharmacyEntitlements,
): Promise<PharmacyEntitlementsSnapshot> {
  const [routeFeatureMap, features] = await Promise.all([
    getRouteFeatureMap(admin),
    listPlatformFeatures(admin),
  ]);
  const featureLabels: Record<string, string> = {};
  for (const f of features) {
    featureLabels[f.key] = f.display_name;
  }
  return {
    pharmacyId: ent.pharmacyId,
    pharmacyStatus: ent.pharmacyStatus,
    effectivePlan: ent.effectivePlan,
    effectivePlanLabel: ent.effectivePlanLabel,
    isAccessAllowed: ent.isAccessAllowed,
    accessBlockReason: ent.accessBlockReason,
    isExpired: ent.isExpired,
    daysRemaining: ent.daysRemaining,
    featureKeys: ent.featureKeys,
    limits: ent.limits,
    usage: ent.usage,
    routeFeatureMap,
    featureLabels,
  };
}

export function featureForPath(
  pathname: string,
  routeFeatureMap: Record<string, string>,
): string | null {
  const normalized = pathname.split("?")[0].replace(/\/$/, "") || "/";
  const entries = Object.entries(routeFeatureMap).sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [route, key] of entries) {
    const r = route.replace(/\/$/, "") || "/";
    if (normalized === r || normalized.startsWith(`${r}/`)) {
      return key;
    }
  }
  return null;
}
