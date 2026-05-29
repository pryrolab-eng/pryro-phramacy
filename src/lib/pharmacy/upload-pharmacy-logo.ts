import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isCloudinaryConfigured,
  uploadPharmacyLogoToCloudinary,
} from "@/lib/cloudinary/pharmacy-logo";
import { savePharmacyBrandingRow } from "@/lib/pharmacy/branding-db";

/**
 * Upload logo to Cloudinary when configured, otherwise Supabase Storage.
 * Always persists pharmacies.logo_url.
 */
export async function uploadAndPersistPharmacyLogo(
  supabase: SupabaseClient,
  pharmacyId: string,
  file: File | { buffer: Buffer; type: string; name: string },
): Promise<string> {
  const buffer =
    file instanceof File ? Buffer.from(await file.arrayBuffer()) : file.buffer;
  const mimeType =
    file instanceof File ? file.type || "image/png" : file.type || "image/png";

  let publicUrl: string;

  if (isCloudinaryConfigured()) {
    publicUrl = await uploadPharmacyLogoToCloudinary(buffer, pharmacyId, mimeType);
  } else {
    const ext = (file instanceof File ? file.name : file.name).split(".").pop() || "png";
    const fileName = `${pharmacyId}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("pharmacy-logos")
      .upload(fileName, buffer, { contentType: mimeType, upsert: true });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl: storageUrl },
    } = supabase.storage.from("pharmacy-logos").getPublicUrl(fileName);

    publicUrl = storageUrl;
  }

  await savePharmacyBrandingRow(supabase, pharmacyId, { logoUrl: publicUrl });
  return publicUrl;
}
