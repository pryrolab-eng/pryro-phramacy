"use client";

import { useQuery } from "@tanstack/react-query";
import {
  entitlementsKeys,
  getPharmacyEntitlementsSnapshot,
} from "@/lib/http/entitlements";
import type { PharmacyEntitlementsSnapshot } from "@/lib/subscription/lifecycle/types";
import { getFeatureLabel } from "@/lib/subscription/feature-labels";

export type { PharmacyEntitlementsSnapshot };

const EMPTY: PharmacyEntitlementsSnapshot = {
  pharmacyId: "",
  effectivePlan: null,
  effectivePlanLabel: "standard",
  isAccessAllowed: false,
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

export function usePharmacyEntitlements(options?: { enabled?: boolean }) {
  const query = useQuery({
    queryKey: entitlementsKeys.pharmacy(),
    queryFn: getPharmacyEntitlementsSnapshot,
    enabled: options?.enabled ?? true,
    staleTime: 60 * 1000,
  });

  const data = query.data ?? EMPTY;
  const featureSet = new Set(data.featureKeys);

  return {
    ...query,
    entitlements: data,
    can: (featureKey: string) =>
      data.isAccessAllowed && featureSet.has(featureKey),
    featureLabel: (featureKey: string) =>
      getFeatureLabel(featureKey, data.featureLabels),
    withinLimit: (limitKey: "users" | "branches") => {
      if (!data.isAccessAllowed) {
        return { allowed: false, reason: "Subscription inactive", current: 0, limit: 0 };
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
