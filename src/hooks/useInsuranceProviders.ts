"use client";

import {
  getInsuranceProviders,
  insuranceProvidersQueryKey,
  uploadInsurancePricing,
  type UploadInsurancePricingInput,
} from "@/lib/http/insurance";
import { useMutation, useQuery } from "@tanstack/react-query";

export { insuranceProvidersQueryKey } from "@/lib/http/insurance";
export type { InsuranceProviderRow } from "@/lib/http/insurance";

export function useInsuranceProviders(options?: { enabled?: boolean }) {
  return useQuery({
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

export type { UploadInsurancePricingInput };
