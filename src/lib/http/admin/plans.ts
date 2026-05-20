import { ensureApiSuccess, fetchJson } from "../client";

export const adminPlansQueryKey = ["admin", "plans"] as const;

export type AdminSubscriptionPlanRow = Record<string, unknown> & {
  id: string;
  name: string;
  price?: number | string;
  period?: string;
  features?: unknown;
  is_popular?: boolean;
  is_active?: boolean;
  /** Active rows in `subscriptions` whose `plan` matches this catalog name (case-insensitive). */
  active_subscriber_count?: number;
};

export async function getAdminPlans(): Promise<AdminSubscriptionPlanRow[]> {
  const data = await fetchJson<unknown>("/api/admin/plans");
  if (!Array.isArray(data)) {
    throw new Error("Invalid plans response");
  }
  return data as AdminSubscriptionPlanRow[];
}

export type PolarSyncNote = {
  action?: string;
  error?: string;
};

export async function createAdminPlan(
  body: Record<string, unknown>,
): Promise<{ plan: AdminSubscriptionPlanRow; polarSync?: PolarSyncNote }> {
  const data = await fetchJson<{
    success: boolean;
    plan?: AdminSubscriptionPlanRow;
    polarSync?: PolarSyncNote;
    error?: string;
  }>("/api/admin/plans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  ensureApiSuccess(data, "Failed to add plan");
  if (!data.plan) throw new Error("Invalid plan response");
  return { plan: data.plan, polarSync: data.polarSync };
}

export async function syncAllPlansToPolar(): Promise<{
  synced: number;
  failed: number;
  skipped: number;
  results: unknown[];
}> {
  const data = await fetchJson<{
    success: boolean;
    synced?: number;
    failed?: number;
    skipped?: number;
    results?: unknown[];
    error?: string;
  }>("/api/admin/plans/sync-polar", { method: "POST" });
  ensureApiSuccess(data, "Failed to sync plans to Polar");
  return {
    synced: data.synced ?? 0,
    failed: data.failed ?? 0,
    skipped: data.skipped ?? 0,
    results: data.results ?? [],
  };
}

export async function updateAdminPlan(
  id: string,
  body: Record<string, unknown>,
): Promise<void> {
  const data = await fetchJson<{ success: boolean; error?: string }>(
    `/api/admin/plans/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  ensureApiSuccess(data, "Failed to update plan");
}
