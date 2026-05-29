"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getPharmacyBranding,
  pharmacyBrandingKeys,
} from "@/lib/http/pharmacy-branding";
import { DEFAULT_PHARMACY_BRANDING } from "@/lib/pharmacy/default-branding";

export { DEFAULT_PHARMACY_BRANDING };

export function usePharmacyBranding(
  pharmacyId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: pharmacyBrandingKeys.detail(pharmacyId ?? ""),
    queryFn: getPharmacyBranding,
    enabled: Boolean(pharmacyId) && (options?.enabled ?? true),
    staleTime: 60_000,
  });
}
