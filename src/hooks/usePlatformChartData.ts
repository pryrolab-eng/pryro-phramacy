"use client";

import { useMemo } from "react";

import { buildPlatformChartSeries } from "@/lib/admin/chart-series";
import { useAdminPharmacies } from "./useAdminPharmacies";
import { useAdminReportsSummary } from "./useAdminReportsSummary";

/** Revenue + pharmacy sign-ups series for admin dashboard and reports. */
export function usePlatformChartData(options?: { months?: 6 | 12 }) {
  const reportsQ = useAdminReportsSummary();
  const pharmaciesQ = useAdminPharmacies();

  const chartData = useMemo(() => {
    const pharmacies = (pharmaciesQ.data ?? []) as Array<{
      created_at?: string | null;
    }>;
    const revenueData = reportsQ.data?.revenueData ?? [];
    return buildPlatformChartSeries(pharmacies, revenueData, {
      months: options?.months ?? 12,
    });
  }, [pharmaciesQ.data, reportsQ.data?.revenueData, options?.months]);

  const hasPaymentHistory = (reportsQ.data?.revenueData?.length ?? 0) > 0;
  const hasChartActivity = chartData.some(
    (d) => d.revenue > 0 || d.pharmacies > 0,
  );

  const loading = reportsQ.isPending || pharmaciesQ.isPending;
  const error =
    reportsQ.error instanceof Error
      ? reportsQ.error.message
      : pharmaciesQ.error instanceof Error
        ? pharmaciesQ.error.message
        : null;

  return {
    chartData,
    hasPaymentHistory,
    hasChartActivity,
    reports: reportsQ.data,
    loading,
    error: error && !loading ? error : null,
    refetch: () => {
      void reportsQ.refetch();
      void pharmaciesQ.refetch();
    },
  };
}
