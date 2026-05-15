"use client";

import {
  getInsuranceProviders,
  insuranceProvidersQueryKey,
} from "@/lib/http/insurance";
import { useQuery } from "@tanstack/react-query";

export { insuranceProvidersQueryKey } from "@/lib/http/insurance";
export type { InsuranceProviderRow } from "@/lib/http/insurance";

export function useInsuranceProviders(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: insuranceProvidersQueryKey,
    queryFn: getInsuranceProviders,
    enabled: options?.enabled ?? true,
  });
}
