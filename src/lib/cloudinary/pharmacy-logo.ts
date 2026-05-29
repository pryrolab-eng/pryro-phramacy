import { v2 as cloudinary } from "cloudinary";

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

function ensureCloudinary() {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Upload a pharmacy logo to Cloudinary (CDN-backed, auto format/quality).
 * Returns HTTPS URL suitable for storing on pharmacies.logo_url.
 */
export async function uploadPharmacyLogoToCloudinary(
  buffer: Buffer,
  pharmacyId: string,
  mimeType: string,
): Promise<string> {
  ensureCloudinary();

  const base64 = `data:${mimeType};base64,${buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(base64, {
    folder: `pryrox/pharmacies/${pharmacyId}`,
    resource_type: "image",
    overwrite: true,
    invalidate: true,
    transformation: [
      { width: 512, height: 512, crop: "limit" },
      { fetch_format: "auto", quality: "auto" },
    ],
    public_id: "logo",
  });

  if (!result.secure_url) {
    throw new Error("Cloudinary upload did not return a URL");
  }

  return result.secure_url;
}
