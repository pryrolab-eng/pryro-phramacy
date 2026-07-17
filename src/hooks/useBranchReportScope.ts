"use client";

import { useEffect, useMemo, useState } from "react";
import { useOptionalActivePharmacy } from "@/components/providers/active-pharmacy-provider";
import { useBranchScope } from "@/hooks/useBranchScope";
import type { BranchScopeQuery } from "@/lib/pharmacy/branch-scope";

type Options = {
  defaultDays?: number;
};

export function useBranchReportScope(options?: Options) {
  const activePharmacy = useOptionalActivePharmacy();
  const activeBranchId = activePharmacy?.activeBranchId ?? null;
  const allowedBranchIds = activePharmacy?.allowedBranchIds ?? null;
  const { branchScope, setBranchScope } = useBranchScope();
  const [days, setDays] = useState(options?.defaultDays ?? 30);

  // Assigned staff cannot use pharmacy-wide "all" — pin to their location.
  useEffect(() => {
    if (allowedBranchIds === null) return;
    if (branchScope === "all" && activeBranchId) {
      setBranchScope(activeBranchId);
    }
  }, [allowedBranchIds, branchScope, activeBranchId, setBranchScope]);

  const scopeQuery: BranchScopeQuery = useMemo(() => {
    const to = new Date();
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    let branchId: string | undefined;
    if (allowedBranchIds !== null) {
      branchId =
        branchScope !== "all"
          ? branchScope
          : (activeBranchId ?? undefined);
    } else {
      branchId = branchScope === "all" ? undefined : branchScope;
    }

    return {
      branchId,
      from: from.toISOString(),
      to: to.toISOString(),
    };
  }, [branchScope, days, allowedBranchIds, activeBranchId]);

  return {
    branchScope,
    setBranchScope,
    days,
    setDays,
    scopeQuery,
    activeBranchId,
    setBranchScopeToActive: () => {
      if (activeBranchId) setBranchScope(activeBranchId);
    },
  };
}
