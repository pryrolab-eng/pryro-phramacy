"use client";

import { useMemo } from "react";
import { useActivePharmacy } from "@/components/providers/active-pharmacy-provider";
import { useDashboardGraceNav } from "@/hooks/useDashboardGraceNav";
import { usePharmacyEntitlements } from "@/hooks/usePharmacyEntitlements";
import { useSaasBranches } from "@/hooks/useSaasSubscription";
import { resolveSwitcherBranches } from "@/lib/branches/entitled-branches";
import type { SaasBranchWithUsage } from "@/lib/http/saas-branches";

/**
 * Branches the user may see in the shell switcher — deduped, plan-limited, staff-scoped.
 * When access is blocked, only the active branch is returned (read-only).
 */
export function useEntitledBranches() {
  const branchesQuery = useSaasBranches();
  const { activeBranchId, allowedBranchIds, isHydrating: ctxHydrating } =
    useActivePharmacy();
  const { entitlements, isEntitlementsReady } = usePharmacyEntitlements();
  const { isBlocked } = useDashboardGraceNav();

  const allBranches = branchesQuery.data ?? [];

  const branches = useMemo(() => {
    return resolveSwitcherBranches({
      branches: allBranches as SaasBranchWithUsage[],
      maxSlots: Math.max(
        1,
        entitlements.limits?.totalBranchSlots ??
          entitlements.limits?.maxBranches ??
          1,
      ),
      allowedBranchIds,
      activeBranchId,
      accessBlocked: isEntitlementsReady && isBlocked,
    });
  }, [
    allBranches,
    allowedBranchIds,
    activeBranchId,
    entitlements.limits,
    isBlocked,
    isEntitlementsReady,
  ]);

  const isLoading =
    ctxHydrating ||
    branchesQuery.isPending ||
    (branchesQuery.isFetching && branchesQuery.data === undefined);

  return {
    branches,
    isLoading,
    isError: branchesQuery.isError,
    canSwitchBranch: !isBlocked && branches.length > 1,
    isAccessBlocked: isEntitlementsReady && isBlocked,
    totalActiveInDb: allBranches.length,
    entitledSlotCount: entitlements.limits?.totalBranchSlots ?? 1,
  };
}
