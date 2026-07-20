"use client";

import { useQuery } from "@tanstack/react-query";
import {
  entitlementsKeys,
  getPharmacyEntitlementsSnapshot,
} from "@/lib/http/entitlements";
import { ApiError } from "@/lib/http/client";
import type { PharmacyEntitlementsSnapshot } from "@/lib/subscription/lifecycle/types";
import { getFeatureLabel } from "@/lib/subscription/feature-labels";
import { getWithinLimitBlockReason } from "@/lib/subscription/access-block";

export type { PharmacyEntitlementsSnapshot };

/** Placeholder only — never treat as real subscription state. */
const EMPTY: PharmacyEntitlementsSnapshot = {
  pharmacyId: "",
  pharmacyStatus: "active",
  effectivePlan: null,
  effectivePlanLabel: "standard",
  isAccessAllowed: false,
  accessBlockReason: "no_subscription",
  isExpired: true,
  daysRemaining: null,
  featureKeys: [],
  limits: {
    maxUsers: 0,
    maxBranches: 0,
    monthlyTxPerBranch: 0,
    totalBranchSlots: 0,
  },
  usage: { activeUsers: 0, activeBranches: 0 },
  routeFeatureMap: {},
  featureLabels: {},
};

const ENTITLEMENTS_STALE_MS = 5 * 60 * 1000;

export function usePharmacyEntitlements(options?: { enabled?: boolean }) {
  const query = useQuery({
    queryKey: entitlementsKeys.pharmacy(),
    queryFn: getPharmacyEntitlementsSnapshot,
    enabled: options?.enabled ?? true,
    staleTime: ENTITLEMENTS_STALE_MS,
    refetchOnWindowFocus: false,
    refetchInterval: ENTITLEMENTS_STALE_MS,
    refetchIntervalInBackground: false,
    /** Keep last snapshot visible while session refetches on reload/focus. */
    placeholderData: (previousData) => previousData,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 401) {
        return failureCount < 3;
      }
      return failureCount < 1;
    },
    retryDelay: (attempt) => Math.min(400 * (attempt + 1), 1200),
  });

  const hasSnapshot = query.data !== undefined;
  /** True during first load or session restore before a snapshot exists. */
  const isHydrating = !hasSnapshot && !query.isError;
  /** True once we have loaded entitlements at least once this mount. */
  const isEntitlementsReady = hasSnapshot;

  const data = query.data ?? EMPTY;
  const featureSet = new Set(data.featureKeys);

  return {
    ...query,
    entitlements: data,
    hasSnapshot,
    isHydrating,
    isEntitlementsReady,
    can: (featureKey: string) => {
      if (!isEntitlementsReady) return false;
      return data.isAccessAllowed && featureSet.has(featureKey);
    },
    featureLabel: (featureKey: string) =>
      getFeatureLabel(featureKey, data.featureLabels),
    withinLimit: (limitKey: "users" | "branches") => {
      if (!isEntitlementsReady || !data.isAccessAllowed) {
        return {
          allowed: false,
          reason: isHydrating
            ? undefined
            : getWithinLimitBlockReason(
                data.accessBlockReason ?? "subscription_expired",
              ),
          current: 0,
          limit: 0,
        };
      }
      if (limitKey === "users") {
        const current = data.usage.activeUsers;
        const limit = data.limits.maxUsers;
        return {
          allowed: current < limit,
          current,
          limit,
          reason:
            current >= limit
              ? `Your plan allows up to ${limit} users.`
              : undefined,
        };
      }
      const current = data.usage.activeBranches;
      const limit = data.limits.totalBranchSlots;
      return {
        allowed: current < limit,
        current,
        limit,
        reason:
          current >= limit
            ? `Your plan allows up to ${limit} branches.`
            : undefined,
      };
    },
  };
}
