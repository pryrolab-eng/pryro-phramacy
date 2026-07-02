import { ensureApiSuccess, fetchJson } from "../client";

export const adminPlansQueryKey = ["admin", "plans"] as const;

export type AdminSubscriptionPlanRow = Record<string, unknown> & {
  id: string;
  name: string;
  price?: number | string;
  period?: string;
  features?: unknown;
  feature_keys?: string[];
  is_popular?: boolean;
  is_active?: boolean;
  /** Active rows in `subscriptions` whose `plan` matches this catalog name (case-insensitive). */
  active_subscriber_count?: number;
};

export type AdminPlansResponse = {
  plans: AdminSubscriptionPlanRow[];
  duplicateGroups: Array<{
    key: string;
    keeperId: string;
    duplicateIds: string[];
  }>;
};

export async function getAdminPlans(): Promise<AdminPlansResponse> {
  const data = await fetchJson<unknown>("/api/admin/plans");
  if (Array.isArray(data)) {
    return { plans: data as AdminSubscriptionPlanRow[], duplicateGroups: [] };
  }
  if (
    data &&
    typeof data === "object" &&
    "plans" in data &&
    Array.isArray((data as AdminPlansResponse).plans)
  ) {
    return data as AdminPlansResponse;
  }
  throw new Error("Invalid plans response");
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

export type UpdateAdminPlanResponse = {
  success: boolean;
  plan?: AdminSubscriptionPlanRow;
  polarSync?: PolarSyncNote;
  error?: string;
};

export async function updateAdminPlan(
  id: string,
  body: Record<string, unknown>,
): Promise<UpdateAdminPlanResponse> {
  const data = await fetchJson<UpdateAdminPlanResponse>(
    `/api/admin/plans/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  ensureApiSuccess(data, "Failed to update plan");
  return data;
}
