import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  DEFAULT_PLATFORM_SUPPORT_EMAIL,
  normalizeSupportEmail,
} from "@/lib/platform/support-email";

const PUBLIC_SETTING_KEYS = [
  "platformName",
  "platformLogoUrl",
  "supportEmail",
] as const;

const loadPublicBranding = unstable_cache(
  async () => {
    try {
      const settings = await prisma.system_settings.findMany({
        where: {
          pharmacy_id: null,
          setting_key: { in: [...PUBLIC_SETTING_KEYS] },
        },
        select: { setting_key: true, setting_value: true },
      });

      const map: Record<string, string> = {};
      settings.forEach((s) => {
        map[s.setting_key] = String(s.setting_value ?? "");
      });

      return {
        platformName: map.platformName || "Pryrox",
        platformLogoUrl: map.platformLogoUrl || null,
        supportEmail: normalizeSupportEmail(map.supportEmail),
      };
    } catch {
      return {
        platformName: "Pryrox",
        platformLogoUrl: null,
        supportEmail: DEFAULT_PLATFORM_SUPPORT_EMAIL,
      };
    }
  },
  ["public-branding"],
  { revalidate: 300 },
);

/**
 * Public endpoint — no auth required.
 * Returns platform branding and support contact from global system_settings.
 */
export async function GET() {
  return NextResponse.json(await loadPublicBranding());
}
