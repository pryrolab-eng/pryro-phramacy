"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { pharmacyDashboardKeys } from "@/lib/http/pharmacy-dashboard";
import { getCombinedDashboardData } from "@/lib/http/pharmacy-dashboard";
import { inventoryKeys, getCombinedInventoryData } from "@/lib/http/inventory";
import { salesKeys, getCombinedSalesData } from "@/lib/http/sales";
import { customersKeys, getCombinedCustomersData } from "@/lib/http/customers";
import { useBranchReportScope } from "@/hooks/useBranchReportScope";

export function GlobalPrefetchProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { scopeQuery, days } = useBranchReportScope();

  useEffect(() => {
    const staleTime = 10 * 60 * 1000;

    // Prefetch ALL combined pages on mount + scope change
    // so every tab switch is a cache hit — no loading skeletons
    const prefetchAll = async () => {
      await Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: [...pharmacyDashboardKeys.all, "combined", scopeQuery?.branchId ?? "all"],
          queryFn: () => getCombinedDashboardData({ ...scopeQuery, branchId: scopeQuery?.branchId ?? "all" }),
          staleTime,
        }),
        queryClient.prefetchQuery({
          queryKey: inventoryKeys.combined(scopeQuery?.branchId),
          queryFn: () => getCombinedInventoryData(scopeQuery?.branchId),
          staleTime,
        }),
        queryClient.prefetchQuery({
          queryKey: salesKeys.combined(),
          queryFn: getCombinedSalesData,
          staleTime,
        }),
        queryClient.prefetchQuery({
          queryKey: customersKeys.combined(),
          queryFn: getCombinedCustomersData,
          staleTime,
        }),
      ]);
    };

    prefetchAll();
  }, [queryClient, scopeQuery?.branchId, days]);

  return <>{children}</>;
}