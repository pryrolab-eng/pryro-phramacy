import {
  isCloudinaryConfigured,
  uploadPharmacyLogoToCloudinary,
} from "@/lib/cloudinary/pharmacy-logo";
import { savePharmacyBrandingRow } from "@/lib/pharmacy/branding-db";
import {
  localUploadFileUrl,
  saveLocalUpload,
  UPLOAD_CATEGORIES,
} from "@/lib/storage/local-files";

/**
 * Upload logo to Cloudinary when configured, otherwise local disk (VPS-ready).
 * Always persists pharmacies.logo_url.
 */
export async function uploadAndPersistPharmacyLogo(
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
    const objectPath = `${pharmacyId}-${Date.now()}.${ext}`;
    await saveLocalUpload({
      category: UPLOAD_CATEGORIES.pharmacyLogos,
      objectPath,
      buffer,
    });
    publicUrl = localUploadFileUrl(UPLOAD_CATEGORIES.pharmacyLogos, objectPath);
  }

  await savePharmacyBrandingRow(pharmacyId, { logoUrl: publicUrl });
  return publicUrl;
}
