"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  pharmacyDashboardKeys,
  getCombinedDashboardData,
} from "@/lib/http/pharmacy-dashboard";
import { inventoryKeys, getCombinedInventoryData } from "@/lib/http/inventory";
import { salesKeys, getCombinedSalesData } from "@/lib/http/sales";
import { customersKeys, getCombinedCustomersData } from "@/lib/http/customers";
import { prescriptionsKeys, getPrescriptions } from "@/lib/http/prescriptions";
import {
  saasKeys,
  getSaasPlans,
  getSaasSubscriptionSummary,
} from "@/lib/http/saas";
import { useBranchReportScope } from "@/hooks/useBranchReportScope";

const PREFETCH_STALE_MS = 10 * 60 * 1000;

export function GlobalPrefetchProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { scopeQuery, days } = useBranchReportScope();

  useEffect(() => {
    // Warm core pharmacy caches so tab switches hit cache (no full-page loaders).
    const prefetchAll = async () => {
      await Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: pharmacyDashboardKeys.combined(
            scopeQuery?.branchId,
            days,
          ),
          queryFn: () =>
            getCombinedDashboardData({
              ...scopeQuery,
              branchId: scopeQuery?.branchId,
            }),
          staleTime: PREFETCH_STALE_MS,
        }),
        queryClient.prefetchQuery({
          queryKey: inventoryKeys.combined(scopeQuery?.branchId),
          queryFn: () => getCombinedInventoryData(scopeQuery?.branchId),
          staleTime: PREFETCH_STALE_MS,
        }),
        queryClient.prefetchQuery({
          queryKey: salesKeys.combined(),
          queryFn: getCombinedSalesData,
          staleTime: PREFETCH_STALE_MS,
        }),
        queryClient.prefetchQuery({
          queryKey: customersKeys.combined(),
          queryFn: getCombinedCustomersData,
          staleTime: PREFETCH_STALE_MS,
        }),
        queryClient.prefetchQuery({
          queryKey: prescriptionsKeys.list(),
          queryFn: getPrescriptions,
          staleTime: PREFETCH_STALE_MS,
        }),
        queryClient.prefetchQuery({
          queryKey: saasKeys.subscription(),
          queryFn: getSaasSubscriptionSummary,
          staleTime: PREFETCH_STALE_MS,
        }),
        queryClient.prefetchQuery({
          queryKey: saasKeys.plans(),
          queryFn: getSaasPlans,
          staleTime: PREFETCH_STALE_MS,
        }),
      ]);
    };

    void prefetchAll();
  }, [queryClient, scopeQuery, days]);

  return <>{children}</>;
}
