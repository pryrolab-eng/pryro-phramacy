import { ensureApiSuccess, fetchJson } from "./client";

export const settingsApiKeysQueryKey = ["settings", "api-keys"] as const;

export type SettingsApiKeyRow = {
  id: string;
  name: string;
  key?: string;
  key_hash?: string;
  key_prefix?: string;
  status?: string;
  is_active?: boolean;
};

export async function getSettingsApiKeys(): Promise<SettingsApiKeyRow[]> {
  try {
    const data = await fetchJson<SettingsApiKeyRow[]>("/api/settings/api-keys");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function createSettingsApiKey(body: {
  name: string;
  key: string;
}): Promise<{ success: boolean; error?: string }> {
  const data = await fetchJson<{ success: boolean; error?: string }>(
    "/api/settings/api-keys",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  ensureApiSuccess(data, "Failed to add API key");
  return data;
}

export async function updateSettingsApiKey(
  body: SettingsApiKeyRow,
): Promise<{ success: boolean; error?: string }> {
  const data = await fetchJson<{ success: boolean; error?: string }>(
    "/api/settings/api-keys",
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  ensureApiSuccess(data, "Failed to update API key");
  return data;
}
