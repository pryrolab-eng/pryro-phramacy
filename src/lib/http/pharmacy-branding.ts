import { ApiError, fetchJson } from "./client";

export const pharmacyBrandingKeys = {
  all: ["pharmacy", "branding"] as const,
};

export type PharmacyBranding = {
  logoUrl: string;
  primaryColor: string;
  customDomain: string;
};

export async function getPharmacyBranding(): Promise<PharmacyBranding> {
  return fetchJson<PharmacyBranding>("/api/pharmacy/branding");
}

export async function updatePharmacyBranding(
  body: PharmacyBranding,
): Promise<void> {
  await fetchJson("/api/pharmacy/branding", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function uploadPharmacyLogo(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/pharmacy/branding/upload", {
    method: "POST",
    body: formData,
  });
  let data: unknown = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Failed to upload logo";
    throw new ApiError(message, res.status, data);
  }
  return data as { url: string };
}
