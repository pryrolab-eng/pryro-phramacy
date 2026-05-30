"use client";

import {
  adminCategoriesQueryKey,
  getAdminCategories,
} from "@/lib/http/admin/categories";
import {
  adminPharmaciesQueryKey,
  getAdminPharmacies,
} from "@/lib/http/admin/pharmacies";
import { adminPlansQueryKey, getAdminPlans } from "@/lib/http/admin/plans";
import {
  adminReportsSummaryQueryKey,
  getAdminReportsSummary,
} from "@/lib/http/admin/reports";
import { useQueries } from "@tanstack/react-query";
import { adminListQueryDefaults } from "@/lib/query/admin-query-options";

export function useAdminDashboardData() {
  const [pharmaciesQ, plansQ, categoriesQ, reportsQ] = useQueries({
    queries: [
      {
        ...adminListQueryDefaults,
        queryKey: adminPharmaciesQueryKey,
        queryFn: getAdminPharmacies,
      },
      {
        ...adminListQueryDefaults,
        queryKey: adminPlansQueryKey,
        queryFn: getAdminPlans,
      },
      {
        ...adminListQueryDefaults,
        queryKey: adminCategoriesQueryKey,
        queryFn: getAdminCategories,
      },
      {
        ...adminListQueryDefaults,
        queryKey: adminReportsSummaryQueryKey,
        queryFn: getAdminReportsSummary,
      },
    ],
  });

  const loading =
    pharmaciesQ.isLoading ||
    plansQ.isLoading ||
    categoriesQ.isLoading ||
    reportsQ.isLoading;

  return { pharmaciesQ, plansQ, categoriesQ, reportsQ, loading };
}
