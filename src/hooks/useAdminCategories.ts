"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminCategoriesQueryKey,
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategories,
  updateAdminCategory,
} from "@/lib/http/admin/categories";
import { adminListQueryDefaults } from "@/lib/query/admin-query-options";

export { adminCategoriesQueryKey } from "@/lib/http/admin/categories";
export type { AdminCategoryRow } from "@/lib/http/admin/categories";

export function useAdminCategories(options?: { enabled?: boolean }) {
  return useQuery({
    ...adminListQueryDefaults,
    queryKey: adminCategoriesQueryKey,
    queryFn: getAdminCategories,
    enabled: options?.enabled ?? true,
  });
}

export function useCreateAdminCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminCategory,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminCategoriesQueryKey }),
  });
}

export function useUpdateAdminCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { name: string; description: string; status: string };
    }) => updateAdminCategory(id, body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminCategoriesQueryKey }),
  });
}

export function useDeleteAdminCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminCategory,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminCategoriesQueryKey }),
  });
}
