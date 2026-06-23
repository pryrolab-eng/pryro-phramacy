import { fetchJson } from "../client";

export const adminApiKeysQueryKey = ["admin", "api-keys"] as const;
export const adminIpWhitelistQueryKey = ["admin", "ip-whitelist"] as const;

export type AdminApiKeyRow = {
  id: string;
  name: string;
  key_prefix: string;
  permissions?: string[];
  is_active: boolean;
  created_at?: string;
};

export async function deleteAdminApiKey(id: string): Promise<{ success: boolean }> {
  return fetchJson(`/api/admin/api-keys?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export type AdminIpWhitelistRow = {
  id: string;
  ip_address: string;
  description?: string | null;
  is_active?: boolean;
};

export async function getAdminApiKeys(): Promise<AdminApiKeyRow[]> {
  return fetchJson<AdminApiKeyRow[]>("/api/admin/api-keys");
}

export async function createAdminApiKey(body: {
  name: string;
  key: string;
  permissions?: string[];
}): Promise<{ success: boolean; apiKey?: AdminApiKeyRow }> {
  return fetchJson("/api/admin/api-keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function updateAdminApiKey(body: {
  id: string;
  name: string;
  key?: string;
  status: string;
  permissions?: string[];
}): Promise<{ success: boolean }> {
  return fetchJson("/api/admin/api-keys", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function getAdminIpWhitelist(): Promise<{ ips: AdminIpWhitelistRow[] }> {
  return fetchJson("/api/admin/ip-whitelist");
}

export async function addAdminIpWhitelist(body: {
  ip: string;
  description?: string;
}): Promise<{ success: boolean }> {
  return fetchJson("/api/admin/ip-whitelist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function deleteAdminIpWhitelist(id: string): Promise<{ success: boolean }> {
  return fetchJson("/api/admin/ip-whitelist", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}
