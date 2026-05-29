"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getReportsInventory,
  getReportsSales,
  reportsKeys,
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
    ]);
}
