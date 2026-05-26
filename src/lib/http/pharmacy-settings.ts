import { fetchJson } from "./client";

export const pharmacySettingsKeys = {
  all: ["pharmacy", "settings"] as const,
  info: () => [...pharmacySettingsKeys.all, "info"] as const,
};

export type PharmacySettings = {
  name: string;
  license: string;
  location: string;
  phone: string;
  email: string;
  subscription: string;
  subscriptionExpiresAt?: string | null;
  currency: string;
  language: string;
};

export type UpdatePharmacySettingsInput = {
  name: string;
  location: string;
  phone: string;
  email: string;
  currency: string;
  language: string;
};

export async function getPharmacySettings(): Promise<PharmacySettings> {
  return fetchJson<PharmacySettings>("/api/pharmacy/settings");
}

export async function updatePharmacySettings(
  body: UpdatePharmacySettingsInput,
): Promise<void> {
  await fetchJson("/api/pharmacy/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
