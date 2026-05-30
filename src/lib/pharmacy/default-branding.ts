import type { PharmacyBranding } from "@/lib/http/pharmacy-branding";

/** Pryrox default look when customization is not on the pharmacy plan. */
export const DEFAULT_PHARMACY_BRANDING: PharmacyBranding = {
  platformName: "",
  logoUrl: "",
  primaryColor: "#171717",
  customDomain: "",
};
