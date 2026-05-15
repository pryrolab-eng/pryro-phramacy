"use client";

import {
  adminCategoriesQueryKey,
  getAdminCategories,
} from "@/lib/http/admin/categories";
import { useQuery } from "@tanstack/react-query";

export { adminCategoriesQueryKey } from "@/lib/http/admin/categories";

export function useAdminCategories(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminCategoriesQueryKey,
    queryFn: getAdminCategories,
    enabled: options?.enabled ?? true,
  });
}
