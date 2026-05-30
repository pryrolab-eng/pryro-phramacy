import type { SupabaseClient } from "@supabase/supabase-js";
import type { PharmacyBranding } from "@/lib/http/pharmacy-branding";

export async function loadPharmacyBrandingRow(
  supabase: SupabaseClient,
  pharmacyId: string,
): Promise<PharmacyBranding | null> {
  const { data, error } = await supabase
    .from("pharmacies")
    .select("platform_name, logo_url, primary_color, custom_domain")
    .eq("id", pharmacyId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    platformName: data.platform_name || "",
    logoUrl: data.logo_url || "",
    primaryColor: data.primary_color || "#171717",
    customDomain: data.custom_domain || "",
  };
}

export async function savePharmacyBrandingRow(
  supabase: SupabaseClient,
  pharmacyId: string,
  body: Partial<PharmacyBranding>,
): Promise<void> {
  const updateData: Record<string, string | null> = {};
  if (body.platformName !== undefined) {
    updateData.platform_name = body.platformName.trim() || null;
  }
  if (body.logoUrl !== undefined) updateData.logo_url = body.logoUrl || null;
  if (body.primaryColor) updateData.primary_color = body.primaryColor;
  if (body.customDomain !== undefined) {
    updateData.custom_domain = body.customDomain || null;
  }

  if (Object.keys(updateData).length === 0) return;

  const { error } = await supabase
    .from("pharmacies")
    .update(updateData)
    .eq("id", pharmacyId);

  if (error) throw error;
}
