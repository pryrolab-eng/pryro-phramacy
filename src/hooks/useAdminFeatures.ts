"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminFeaturesQueryKey,
  createAdminFeature,
  getAdminFeatures,
  updateAdminFeature,
  type UpsertPlatformFeatureInput,
} from "@/lib/http/admin/features";
import { adminListQueryDefaults } from "@/lib/query/admin-query-options";

export function useAdminFeatures() {
  return useQuery({
    ...adminListQueryDefaults,
    queryKey: adminFeaturesQueryKey,
    queryFn: getAdminFeatures,
  });
}

export function useCreateAdminFeatureMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertPlatformFeatureInput) => createAdminFeature(body),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: adminFeaturesQueryKey }),
  });
}

export function useUpdateAdminFeatureMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      key,
      body,
    }: {
      key: string;
      body: Partial<UpsertPlatformFeatureInput>;
    }) => updateAdminFeature(key, body),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: adminFeaturesQueryKey }),
  });
}
