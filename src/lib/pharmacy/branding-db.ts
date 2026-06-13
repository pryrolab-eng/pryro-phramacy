import type { PharmacyBranding } from "@/lib/http/pharmacy-branding";
import { prisma } from "@/lib/db/prisma";

export async function loadPharmacyBrandingRow(
  pharmacyId: string,
): Promise<PharmacyBranding | null> {
  const row = await prisma.pharmacies.findUnique({
    where: { id: pharmacyId },
    select: {
      platform_name: true,
      logo_url: true,
      primary_color: true,
      custom_domain: true,
    },
  });
  if (!row) return null;
  return {
    platformName: row.platform_name || "",
    logoUrl: row.logo_url || "",
    primaryColor: row.primary_color || "#171717",
    customDomain: row.custom_domain || "",
  };
}

export async function savePharmacyBrandingRow(
  pharmacyId: string,
  body: Partial<PharmacyBranding>,
): Promise<void> {
  const updateData: {
    platform_name?: string | null;
    logo_url?: string | null;
    primary_color?: string;
    custom_domain?: string | null;
    updated_at?: Date;
  } = {};

  if (body.platformName !== undefined) {
    updateData.platform_name = body.platformName.trim() || null;
  }
  if (body.logoUrl !== undefined) updateData.logo_url = body.logoUrl || null;
  if (body.primaryColor) updateData.primary_color = body.primaryColor;
  if (body.customDomain !== undefined) {
    updateData.custom_domain = body.customDomain || null;
  }

  if (Object.keys(updateData).length === 0) return;

  await prisma.pharmacies.update({
    where: { id: pharmacyId },
    data: { ...updateData, updated_at: new Date() },
  });
}
