"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
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

const DASHBOARD_STALE_MS = 2 * 60 * 1000;

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
  });
}

export function useStockAlerts(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: pharmacyDashboardKeys.stockAlerts(),
    queryFn: getStockAlerts,
    enabled: options?.enabled ?? true,
    staleTime: DASHBOARD_STALE_MS,
  });
}

export function usePharmacySalesChart(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: pharmacyDashboardKeys.salesChart(),
    queryFn: getPharmacySalesChart,
    enabled: options?.enabled ?? true,
    staleTime: DASHBOARD_STALE_MS,
  });
}

export function usePharmacyWeeklySalesChart(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: pharmacyDashboardKeys.weeklySales(),
    queryFn: getPharmacyWeeklySalesChart,
    enabled: options?.enabled ?? true,
    staleTime: DASHBOARD_STALE_MS,
  });
}

export function usePharmacyCategorySalesChart(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: pharmacyDashboardKeys.categorySales(),
    queryFn: getPharmacyCategorySalesChart,
    enabled: options?.enabled ?? true,
    staleTime: DASHBOARD_STALE_MS,
  });
}

export function usePharmacyInventoryChart(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: pharmacyDashboardKeys.inventoryChart(),
    queryFn: getPharmacyInventoryChart,
    enabled: options?.enabled ?? true,
    staleTime: DASHBOARD_STALE_MS,
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
