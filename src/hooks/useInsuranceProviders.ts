"use client";

import {
  getInsuranceProviders,
  insuranceProvidersQueryKey,
  updateClaimStatus,
  applyFormularyCoverage,
  uploadInsurancePricing,
  type ApplyFormularyCoverageInput,
  type UpdateClaimStatusInput,
  type UploadInsurancePricingInput,
} from "@/lib/http/insurance";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminListQueryDefaults } from "@/lib/query/admin-query-options";
import { insuranceReportsKey } from "@/lib/http/insurance-reports";

export { insuranceProvidersQueryKey } from "@/lib/http/insurance";
export type { InsuranceProviderRow } from "@/lib/http/insurance";

export function useInsuranceProviders(options?: { enabled?: boolean }) {
  return useQuery({
    ...adminListQueryDefaults,
    queryKey: insuranceProvidersQueryKey,
    queryFn: getInsuranceProviders,
    enabled: options?.enabled ?? true,
  });
}

export function useUploadInsurancePricingMutation() {
  return useMutation({
    mutationFn: (body: UploadInsurancePricingInput) => uploadInsurancePricing(body),
  });
}

export function useApplyFormularyCoverageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ApplyFormularyCoverageInput) => applyFormularyCoverage(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["insurance"] });
    },
  });
}

export function useUpdateClaimStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateClaimStatusInput) => updateClaimStatus(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reports", "insurance-claims"] });
    },
  });
}

export type { UploadInsurancePricingInput, ApplyFormularyCoverageInput, UpdateClaimStatusInput };
