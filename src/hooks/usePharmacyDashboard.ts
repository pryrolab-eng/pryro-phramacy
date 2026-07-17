"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCombinedDashboardData,
  getPharmacyCategorySalesChart,
  getPharmacyDashboardStats,
  getPharmacyInventoryChart,
  getPharmacySalesChart,
  getPharmacyWeeklySalesChart,
  getRecentPosSales,
  getStockAlerts,
  pharmacyDashboardKeys,
  type CategorySalesChartPoint,
  type InventoryChartPoint,
  type PharmacyDashboardStats,
  type RecentSaleRow,
  type SalesChartPoint,
  type StockAlertsResponse,
  type WeeklySalesChartPoint,
} from "@/lib/http/pharmacy-dashboard";
import type { BranchScopeQuery } from "@/lib/pharmacy/branch-scope";

export {
  pharmacyDashboardKeys,
  type PharmacyDashboardStats,
  type RecentSaleRow,
  type SalesChartPoint,
  type StockAlertRow,
  type StockAlertsResponse,
} from "@/lib/http/pharmacy-dashboard";

const DASHBOARD_STALE_MS = 10 * 60 * 1000; // 10 minutes
const DASHBOARD_GC_MS = 30 * 60 * 1000; // 30 minutes

export type CombinedDashboardData = {
  stats: PharmacyDashboardStats;
  recentSales: RecentSaleRow[];
  stockAlerts: StockAlertsResponse;
  salesChart: SalesChartPoint[];
  weeklySales: WeeklySalesChartPoint[];
  categorySales: CategorySalesChartPoint[];
  inventoryChart: InventoryChartPoint[];
};

export function useCombinedPharmacyDashboard(options?: {
  enabled?: boolean;
  scope?: BranchScopeQuery;
  scopeDays?: number;
}) {
  const queryClient = useQueryClient();
  const days = options?.scopeDays ?? 30;
  const queryKey = pharmacyDashboardKeys.combined(
    options?.scope?.branchId,
    days,
  );
  return useQuery({
    queryKey,
    queryFn: () => getCombinedDashboardData(options?.scope),
    enabled: options?.enabled ?? true,
    staleTime: DASHBOARD_STALE_MS,
    gcTime: DASHBOARD_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    placeholderData: (previousData) => previousData,
    initialData: () =>
      queryClient.getQueryData<CombinedDashboardData>(queryKey),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(queryKey)?.dataUpdatedAt,
  });
}

export function usePharmacyDashboardStats(options?: {
  enabled?: boolean;
  scope?: BranchScopeQuery;
  scopeDays?: number;
}) {
  const scope = options?.scope;
  const days = options?.scopeDays ?? 30;
  return useQuery({
    queryKey: pharmacyDashboardKeys.stats(scope?.branchId, days),
    queryFn: () => getPharmacyDashboardStats(scope),
    enabled: options?.enabled ?? true,
    staleTime: DASHBOARD_STALE_MS,
    gcTime: DASHBOARD_GC_MS,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useRecentPosSales(options?: {
  enabled?: boolean;
  scope?: BranchScopeQuery;
  scopeDays?: number;
}) {
  const scope = options?.scope;
  const days = options?.scopeDays ?? 30;
  return useQuery({
    queryKey: pharmacyDashboardKeys.recentSales(scope?.branchId, days),
    queryFn: () => getRecentPosSales(scope),
    enabled: options?.enabled ?? true,
    staleTime: DASHBOARD_STALE_MS,
    gcTime: DASHBOARD_GC_MS,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useStockAlerts(options?: { enabled?: boolean; branchId?: string | null }) {
  const branchId = options?.branchId;
  return useQuery({
    queryKey: pharmacyDashboardKeys.stockAlerts(branchId),
    queryFn: () => getStockAlerts(branchId),
    enabled: options?.enabled ?? true,
    staleTime: DASHBOARD_STALE_MS,
    gcTime: DASHBOARD_GC_MS,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function usePharmacySalesChart(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: pharmacyDashboardKeys.salesChart(),
    queryFn: getPharmacySalesChart,
    enabled: options?.enabled ?? true,
    staleTime: DASHBOARD_STALE_MS,
    gcTime: DASHBOARD_GC_MS,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function usePharmacyWeeklySalesChart(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: pharmacyDashboardKeys.weeklySales(),
    queryFn: getPharmacyWeeklySalesChart,
    enabled: options?.enabled ?? true,
    staleTime: DASHBOARD_STALE_MS,
    gcTime: DASHBOARD_GC_MS,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function usePharmacyCategorySalesChart(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: pharmacyDashboardKeys.categorySales(),
    queryFn: getPharmacyCategorySalesChart,
    enabled: options?.enabled ?? true,
    staleTime: DASHBOARD_STALE_MS,
    gcTime: DASHBOARD_GC_MS,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function usePharmacyInventoryChart(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: pharmacyDashboardKeys.inventoryChart(),
    queryFn: getPharmacyInventoryChart,
    enabled: options?.enabled ?? true,
    staleTime: DASHBOARD_STALE_MS,
    gcTime: DASHBOARD_GC_MS,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export type {
  CategorySalesChartPoint,
  InventoryChartPoint,
  WeeklySalesChartPoint,
} from "@/lib/http/pharmacy-dashboard";

/** True while any overview panel query is still loading. */
export function usePharmacyDashboardOverviewLoading(
  queries: Array<{ isPending: boolean }>,
) {
  return queries.some((q) => q.isPending);
}

export function useInvalidatePharmacyDashboard() {
  const queryClient = useQueryClient();
  return {
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: pharmacyDashboardKeys.all }),
    invalidateStats: () =>
      queryClient.invalidateQueries({ queryKey: [...pharmacyDashboardKeys.all, "stats"] }),
    invalidateRecentSales: () =>
      queryClient.invalidateQueries({
        queryKey: [...pharmacyDashboardKeys.all, "recent-sales"],
      }),
    invalidateStockAlerts: () =>
      queryClient.invalidateQueries({
        queryKey: pharmacyDashboardKeys.stockAlerts(),
      }),
  };
}
