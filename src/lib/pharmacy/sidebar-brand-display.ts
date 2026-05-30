import type { PharmacyBranding } from "@/lib/http/pharmacy-branding";

/** Default sidebar title when customization is not on the plan. */
export const DEFAULT_SIDEBAR_PLATFORM_NAME = "Pryrox";

export function resolveSidebarBrandTitle(
  hasCustomization: boolean,
  branding: PharmacyBranding,
  pharmacyName: string,
): string {
  if (!hasCustomization) return DEFAULT_SIDEBAR_PLATFORM_NAME;
  return branding.platformName?.trim() || pharmacyName;
}
