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

export function useAdminDashboardData() {
  const [pharmaciesQ, plansQ, categoriesQ, reportsQ] = useQueries({
    queries: [
      {
        queryKey: adminPharmaciesQueryKey,
        queryFn: getAdminPharmacies,
      },
      {
        queryKey: adminPlansQueryKey,
        queryFn: getAdminPlans,
      },
      {
        queryKey: adminCategoriesQueryKey,
        queryFn: getAdminCategories,
      },
      {
        queryKey: adminReportsSummaryQueryKey,
        queryFn: getAdminReportsSummary,
      },
    ],
  });

  const loading =
    pharmaciesQ.isPending ||
    plansQ.isPending ||
    categoriesQ.isPending ||
    reportsQ.isPending;

  return { pharmaciesQ, plansQ, categoriesQ, reportsQ, loading };
}
