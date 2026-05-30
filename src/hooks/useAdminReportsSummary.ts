"use client";

import {
  adminReportsSummaryQueryKey,
  getAdminReportsSummary,
} from "@/lib/http/admin/reports";
import { useQuery } from "@tanstack/react-query";
import { adminListQueryDefaults } from "@/lib/query/admin-query-options";

export { adminReportsSummaryQueryKey } from "@/lib/http/admin/reports";
export type {
  AdminReportsSummary,
  ExportableReport,
} from "@/lib/http/admin/reports";

export function useAdminReportsSummary(options?: { enabled?: boolean }) {
  return useQuery({
    ...adminListQueryDefaults,
    queryKey: adminReportsSummaryQueryKey,
    queryFn: getAdminReportsSummary,
    enabled: options?.enabled ?? true,
  });
}
