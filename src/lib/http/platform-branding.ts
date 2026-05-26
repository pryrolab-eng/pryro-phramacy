import { fetchJson } from "./client";

export const platformBrandingKeys = {
  all: ["platform", "branding"] as const,
};

export type PlatformBranding = {
  platformName: string;
  platformLogoUrl: string | null;
};

const DEFAULT_BRANDING: PlatformBranding = {
  platformName: "Pryrox",
  platformLogoUrl: null,
};

export async function getPlatformBranding(): Promise<PlatformBranding> {
  try {
    return await fetchJson<PlatformBranding>("/api/branding");
  } catch {
    return DEFAULT_BRANDING;
  }
}
