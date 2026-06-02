import { DEFAULT_PLATFORM_SUPPORT_EMAIL } from "@/lib/platform/support-email";
import { fetchJson } from "./client";

export const platformBrandingKeys = {
  all: ["platform", "branding"] as const,
};

export type PlatformBranding = {
  platformName: string;
  platformLogoUrl: string | null;
  supportEmail: string;
};

const DEFAULT_BRANDING: PlatformBranding = {
  platformName: "Pryrox",
  platformLogoUrl: null,
  supportEmail: DEFAULT_PLATFORM_SUPPORT_EMAIL,
};

export async function getPlatformBranding(): Promise<PlatformBranding> {
  try {
    return await fetchJson<PlatformBranding>("/api/branding");
  } catch {
    return DEFAULT_BRANDING;
  }
}
