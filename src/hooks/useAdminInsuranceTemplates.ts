"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminInsuranceTemplatesQueryKey,
  createAdminInsuranceTemplate,
  deleteAdminInsuranceTemplate,
  getAdminInsuranceTemplates,
  updateAdminInsuranceTemplate,
} from "@/lib/http/admin/insurance-templates";
import { adminListQueryDefaults } from "@/lib/query/admin-query-options";

export { adminInsuranceTemplatesQueryKey } from "@/lib/http/admin/insurance-templates";
export type { AdminInsuranceTemplateRow } from "@/lib/http/admin/insurance-templates";

export function useAdminInsuranceTemplates(options?: { enabled?: boolean }) {
  return useQuery({
    ...adminListQueryDefaults,
    queryKey: adminInsuranceTemplatesQueryKey,
    queryFn: getAdminInsuranceTemplates,
    enabled: options?.enabled ?? true,
  });
}

export function useCreateAdminInsuranceTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminInsuranceTemplate,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: adminInsuranceTemplatesQueryKey,
      }),
  });
}

export function useUpdateAdminInsuranceTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof updateAdminInsuranceTemplate>[1];
    }) => updateAdminInsuranceTemplate(id, body),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: adminInsuranceTemplatesQueryKey,
      }),
  });
}

export function useDeleteAdminInsuranceTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminInsuranceTemplate,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: adminInsuranceTemplatesQueryKey,
      }),
  });
}
