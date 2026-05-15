"use client";

import {
  adminReportsSummaryQueryKey,
  getAdminReportsSummary,
} from "@/lib/http/admin/reports";
import { useQuery } from "@tanstack/react-query";

export { adminReportsSummaryQueryKey } from "@/lib/http/admin/reports";
export type {
  AdminReportsSummary,
  ExportableReport,
} from "@/lib/http/admin/reports";

export function useAdminReportsSummary(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminReportsSummaryQueryKey,
    queryFn: getAdminReportsSummary,
    enabled: options?.enabled ?? true,
  });
}
