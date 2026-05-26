import { ensureApiSuccess, fetchJson } from "../client";
import type { PlatformFeatureRow } from "@/lib/subscription/plan-features";

export const adminFeaturesQueryKey = ["admin", "features"] as const;

export type UpsertPlatformFeatureInput = {
  key: string;
  display_name: string;
  description?: string;
  group: string;
  feature_type: "boolean" | "limit" | "metered";
  limit_column?: string | null;
  nav_routes?: string[];
  sort_order?: number;
  is_active?: boolean;
};

export async function getAdminFeatures(): Promise<PlatformFeatureRow[]> {
  const data = await fetchJson<{ features: PlatformFeatureRow[] }>(
    "/api/admin/features",
    { credentials: "include", cache: "no-store" },
  );
  return data.features ?? [];
}

export async function createAdminFeature(body: UpsertPlatformFeatureInput) {
  const data = await fetchJson<{ success: boolean; feature?: PlatformFeatureRow; error?: string }>(
    "/api/admin/features",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    },
  );
  ensureApiSuccess(data, "Failed to create feature");
  return data.feature!;
}

export async function updateAdminFeature(
  key: string,
  body: Partial<UpsertPlatformFeatureInput>,
) {
  const data = await fetchJson<{ success: boolean; feature?: PlatformFeatureRow; error?: string }>(
    `/api/admin/features/${encodeURIComponent(key)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    },
  );
  ensureApiSuccess(data, "Failed to update feature");
  return data.feature!;
}
