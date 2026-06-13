import {
  getEntitlementPlanById,
  getPharmacyStatus,
  listMainSubscriptionCandidates,
} from "@/lib/db/subscriptions";
import { storeCountPharmacyUsage } from "@/lib/db/pharmacy-usage-store";
import { storeListPlatformFeatures, storeLoadPlanFeatureKeys } from "@/lib/db/plan-features-store";
import { getBranchCapacityFromDb } from "@/lib/db/branch-capacity";
import {
  type PharmacyEntitlements,
  type PharmacyEntitlementsSnapshot,
} from "./types";
import { assemblePharmacyEntitlements } from "./assemble-entitlements";
import { type MainSubscriptionRow } from "./entitlement-helpers";

export type { MainSubscriptionRow };

async function resolvePharmacyEntitlementsPrisma(
  pharmacyId: string,
): Promise<PharmacyEntitlements> {
  const pharmacyStatus = await getPharmacyStatus(pharmacyId);
  const candidates = await listMainSubscriptionCandidates(pharmacyId);

  return assemblePharmacyEntitlements(pharmacyId, pharmacyStatus, candidates, {
    loadPlanById: getEntitlementPlanById,
    loadUsage: () => storeCountPharmacyUsage(pharmacyId),
    getBranchCapacity: () => getBranchCapacityFromDb(pharmacyId),
    loadPlanFeatureKeys: (planId) => storeLoadPlanFeatureKeys(planId),
  });
}

export async function resolvePharmacyEntitlements(
  pharmacyId: string,
): Promise<PharmacyEntitlements> {
  return resolvePharmacyEntitlementsPrisma(pharmacyId);
}

let routeFeatureMapCache: Record<string, string> | null = null;

export async function getRouteFeatureMap(): Promise<Record<string, string>> {
  if (routeFeatureMapCache) return routeFeatureMapCache;
  const features = await storeListPlatformFeatures();
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

/** Platform admins have no active pharmacy — full feature access for admin UI. */
export async function buildPlatformAdminEntitlementsSnapshot(): Promise<PharmacyEntitlementsSnapshot> {
  const [routeFeatureMap, features] = await Promise.all([
    getRouteFeatureMap(),
    storeListPlatformFeatures(),
  ]);
  const featureLabels: Record<string, string> = {};
  const featureKeys: string[] = [];
  for (const f of features) {
    featureLabels[f.key] = f.display_name;
    featureKeys.push(f.key);
  }
  return {
    pharmacyId: "",
    pharmacyStatus: "active",
    effectivePlan: null,
    effectivePlanLabel: "platform",
    isAccessAllowed: true,
    accessBlockReason: "none",
    isExpired: false,
    daysRemaining: null,
    featureKeys,
    limits: {
      maxUsers: 999_999,
      maxBranches: 999_999,
      monthlyTxPerBranch: 999_999,
      totalBranchSlots: 999_999,
    },
    usage: { activeUsers: 0, activeBranches: 0 },
    routeFeatureMap,
    featureLabels,
  };
}

export async function toEntitlementsSnapshot(
  ent: PharmacyEntitlements,
): Promise<PharmacyEntitlementsSnapshot> {
  const [routeFeatureMap, features] = await Promise.all([
    getRouteFeatureMap(),
    storeListPlatformFeatures(),
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

export { resolveJoinedPlan } from "./entitlement-helpers";
