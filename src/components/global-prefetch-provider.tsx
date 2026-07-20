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
    // Defer cross-page prefetch so the current route wins the connection pool first.
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

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => {
        void prefetchAll();
      }, { timeout: 5000 });
      return () => window.cancelIdleCallback(id);
    }

    const timer = window.setTimeout(() => {
      void prefetchAll();
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [queryClient, scopeQuery, days]);

  return <>{children}</>;
}
