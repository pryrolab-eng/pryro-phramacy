"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCombinedReportsData,
  getReportsInventory,
  getReportsSales,
  reportsKeys,
  type CombinedReportsData,
  type ReportsInventoryData,
  type ReportsSalesData,
} from "@/lib/http/reports";
import type { BranchScopeQuery } from "@/lib/pharmacy/branch-scope";

export {
  reportsKeys,
  type ReportsInventoryData,
  type ReportsSalesData,
} from "@/lib/http/reports";

export function useReportsSales(options?: {
  enabled?: boolean;
  scope?: BranchScopeQuery;
}) {
  const scope = options?.scope;
  return useQuery({
    queryKey: reportsKeys.sales(scope),
    queryFn: () => getReportsSales(scope),
    enabled: options?.enabled ?? true,
  });
}

export function useReportsInventory(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: reportsKeys.inventory(),
    queryFn: getReportsInventory,
    enabled: options?.enabled ?? true,
  });
}

export function useInvalidateReports() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [...reportsKeys.all, "sales"] }),
      queryClient.invalidateQueries({ queryKey: reportsKeys.inventory() }),
      queryClient.invalidateQueries({
        queryKey: [...reportsKeys.all, "combined"],
      }),
      queryClient.invalidateQueries({
        queryKey: [...reportsKeys.all, "insurance-claims"],
      }),
    ]);
}

export type { CombinedReportsData } from "@/lib/http/reports";

const COMBINED_STALE_MS = 10 * 60 * 1000;
const COMBINED_GC_MS = 30 * 60 * 1000;

export function useCombinedReports(options?: {
  enabled?: boolean;
  scope?: BranchScopeQuery;
}) {
  return useQuery({
    queryKey: reportsKeys.combined(options?.scope),
    queryFn: () => getCombinedReportsData(options?.scope),
    enabled: options?.enabled ?? true,
    staleTime: COMBINED_STALE_MS,
    gcTime: COMBINED_GC_MS,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
