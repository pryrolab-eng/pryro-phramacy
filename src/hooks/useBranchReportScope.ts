"use client";

import { useMemo, useState } from "react";
import type { BranchScopeValue } from "@/components/shell/branch-scope-filter";
import { useActivePharmacy } from "@/components/providers/active-pharmacy-provider";
import type { BranchScopeQuery } from "@/lib/pharmacy/branch-scope";

type Options = {
  defaultDays?: number;
};

export function useBranchReportScope(options?: Options) {
  const { activeBranchId } = useActivePharmacy();
  const [branchScope, setBranchScope] = useState<BranchScopeValue>("all");
  const [days, setDays] = useState(options?.defaultDays ?? 30);

  const scopeQuery: BranchScopeQuery = useMemo(() => {
    const to = new Date();
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return {
      branchId: branchScope === "all" ? undefined : branchScope,
      from: from.toISOString(),
      to: to.toISOString(),
    };
  }, [branchScope, days]);

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
