"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminListQueryDefaults } from "@/lib/query/admin-query-options";
import {
  addAdminIpWhitelist,
  adminApiKeysQueryKey,
  adminIpWhitelistQueryKey,
  createAdminApiKey,
  deleteAdminApiKey,
  deleteAdminIpWhitelist,
  getAdminApiKeys,
  getAdminIpWhitelist,
  updateAdminApiKey,
  type AdminApiKeyRow,
} from "@/lib/http/admin/platform-security";

export type { AdminApiKeyRow } from "@/lib/http/admin/platform-security";
export { adminApiKeysQueryKey, adminIpWhitelistQueryKey };

export function useAdminApiKeys(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminApiKeysQueryKey,
    queryFn: getAdminApiKeys,
    enabled: options?.enabled ?? true,
    ...adminListQueryDefaults,
  });
}

export function useAdminIpWhitelist(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminIpWhitelistQueryKey,
    queryFn: getAdminIpWhitelist,
    enabled: options?.enabled ?? true,
    ...adminListQueryDefaults,
  });
}

export function useCreateAdminApiKeyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminApiKey,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminApiKeysQueryKey }),
  });
}

export function useUpdateAdminApiKeyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAdminApiKey,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminApiKeysQueryKey }),
  });
}

export function useAddAdminIpWhitelistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addAdminIpWhitelist,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminIpWhitelistQueryKey }),
  });
}

export function useRemoveAdminIpWhitelistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminIpWhitelist,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminIpWhitelistQueryKey }),
  });
}

export function useDeleteAdminApiKeyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminApiKey,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminApiKeysQueryKey }),
  });
}
