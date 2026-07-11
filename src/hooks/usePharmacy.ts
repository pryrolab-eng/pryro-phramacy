"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getPharmacyDashboardStats,
  getRecentPosSales,
  getStockAlerts,
  pharmacyDashboardKeys,
} from "@/lib/http/pharmacy-dashboard";
import { getMeContext, meContextKeys } from "@/lib/http/me-context";

export const currentPharmacyQueryKey = meContextKeys.all;

export function usePharmacy(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: currentPharmacyQueryKey,
    queryFn: getMeContext,
    enabled: options?.enabled ?? true,
  });
}

/** @deprecated Prefer `usePharmacyDashboardStats`, `useStockAlerts`, `useRecentPosSales`. */
export function useDashboard(pharmacyId?: string) {
  const enabled = Boolean(pharmacyId);

  const statsQuery = useQuery({
    queryKey: pharmacyDashboardKeys.stats(),
    queryFn: () => getPharmacyDashboardStats(),
    enabled,
  });

  const alertsQuery = useQuery({
    queryKey: pharmacyDashboardKeys.stockAlerts(),
    queryFn: () => getStockAlerts(),
    enabled,
  });

  const salesQuery = useQuery({
    queryKey: pharmacyDashboardKeys.recentSales(),
    queryFn: () => getRecentPosSales(),
    enabled,
  });

  return {
    stats: statsQuery.data ?? null,
    alerts: alertsQuery.data?.all ?? [],
    recentSales: salesQuery.data ?? [],
    loading:
      statsQuery.isPending || alertsQuery.isPending || salesQuery.isPending,
    error:
      statsQuery.error ?? alertsQuery.error ?? salesQuery.error ?? null,
    refetch: () => {
      void statsQuery.refetch();
      void alertsQuery.refetch();
      void salesQuery.refetch();
    },
  };
}
