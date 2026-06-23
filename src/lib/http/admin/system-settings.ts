import { ensureApiSuccess, fetchJson } from "../client";

export const adminSystemSettingsQueryKey = ["admin", "system-settings"] as const;

export type AdminSystemSettingsResponse = {
  settings: Record<string, unknown>;
  analytics: {
    active_pharmacies: number;
    total_users: number;
    total_pharmacies: number;
    new_users_30d: number;
  };
  systemMetrics?: {
    systemLoad: number;
    totalMemory: number;
    freeMemory: number;
    uptime: number;
  };
  integrations?: {
    paymentGateway?: {
      configured: boolean;
      status: "healthy" | "not_configured" | string;
      providers?: Record<string, boolean>;
    };
    insurance?: {
      configured: boolean;
      status: "healthy" | "review" | "not_configured" | string;
      activeProviders: number;
      activeTemplates: number;
    };
  };
};

export async function getAdminSystemSettings(): Promise<AdminSystemSettingsResponse> {
  return fetchJson<AdminSystemSettingsResponse>("/api/admin/system-settings");
}

export async function updateAdminSystemSettings(
  updates: Record<string, unknown>,
): Promise<void> {
  const data = await fetchJson<{
    success?: boolean;
    error?: string;
    message?: string;
    updated?: number;
  }>("/api/admin/system-settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  ensureApiSuccess(data, "Failed to save settings");
}
