"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getPlatformBranding,
  platformBrandingKeys,
  type PlatformBranding,
} from "@/lib/http/platform-branding";

import { DEFAULT_PLATFORM_SUPPORT_EMAIL } from "@/lib/platform/support-email";

const DEFAULT_BRANDING: PlatformBranding = {
  platformName: "Pryrox",
  platformLogoUrl: null,
  supportEmail: DEFAULT_PLATFORM_SUPPORT_EMAIL,
};

export function useBranding(): PlatformBranding {
  const query = useQuery({
    queryKey: platformBrandingKeys.all,
    queryFn: getPlatformBranding,
    staleTime: 5 * 60 * 1000,
  });

  return query.data ?? DEFAULT_BRANDING;
}
