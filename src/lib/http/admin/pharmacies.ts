import type { AdminPharmacyDetail } from "@/lib/admin/pharmacy-detail";
import type { PharmacyBranding } from "@/lib/http/pharmacy-branding";
import { ApiError, ensureApiSuccess, fetchJson } from "../client";

export type AdminPharmacyDetailPayload = AdminPharmacyDetail;

export const adminPharmaciesQueryKey = ["admin", "pharmacies"] as const;

export type AdminPharmacyRow = Record<string, unknown> & {
  id: string;
  name?: string;
  email?: string;
  created_at?: string;
  subscription_plan?: string;
  /** Active main subscription catalog name (authoritative for admin UI). */
  catalog_plan_name?: string | null;
  catalog_plan_price?: number | null;
  is_free_plan?: boolean | null;
  /** Active branch add-on subscriptions (not the main plan). */
  branch_addons_active?: number;
  subscription_expires_at?: string | null;
  /** Subscription-aware access (pending payment, expired, etc.). */
  access_status?: string;
  access_label?: string;
  pending_plan_name?: string | null;
};

export async function getAdminPharmacies(): Promise<AdminPharmacyRow[]> {
  const data = await fetchJson<unknown>("/api/admin/pharmacies");
  return Array.isArray(data) ? (data as AdminPharmacyRow[]) : [];
}

export async function getAdminPharmacyDetail(
  id: string,
  init?: RequestInit,
): Promise<AdminPharmacyDetailPayload> {
  const data = await fetchJson<{
    success: boolean;
    detail?: AdminPharmacyDetailPayload;
    error?: string;
  }>(`/api/admin/pharmacies/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    ...init,
  });
  ensureApiSuccess(data, "Failed to load pharmacy details");
  if (!data.detail) throw new Error("Invalid pharmacy detail response");
  return data.detail;
}

export async function createAdminPharmacy(
  body: Record<string, unknown>,
): Promise<{ pharmacy: AdminPharmacyRow }> {
  const data = await fetchJson<{
    success: boolean;
    pharmacy?: AdminPharmacyRow;
    error?: string;
  }>("/api/admin/pharmacies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  ensureApiSuccess(data, "Failed to create pharmacy");
  if (!data.pharmacy) throw new Error("Invalid pharmacy response");
  return { pharmacy: data.pharmacy };
}

export async function updateAdminPharmacy(
  id: string,
  body: Record<string, unknown>,
): Promise<void> {
  const data = await fetchJson<{ success: boolean; error?: string }>(
    `/api/admin/pharmacies/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  ensureApiSuccess(data, "Failed to update pharmacy");
}

export async function deleteAdminPharmacy(id: string): Promise<void> {
  try {
    const data = await fetchJson<{ success: boolean; error?: string }>(
      `/api/admin/pharmacies/${id}`,
      { method: "DELETE" },
    );
    ensureApiSuccess(data, "Failed to delete pharmacy");
  } catch (e) {
    // Idempotent delete on UI: if already gone, treat as success.
    if (e instanceof ApiError && e.status === 404) return;
    throw e;
  }
}

export type PharmacyRepairResult = {
  success: boolean;
  pharmaciesSynced: number;
  branchAddonReclassified: number;
  duplicateSubsCancelled: number;
  stalePendingCancelled: number;
  trialStatusNormalized: number;
};

export async function repairAdminPharmacies(): Promise<PharmacyRepairResult> {
  const data = await fetchJson<PharmacyRepairResult & { error?: string }>(
    "/api/admin/pharmacies/repair",
    { method: "POST", credentials: "include" },
  );
  ensureApiSuccess(data, "Failed to repair pharmacy data");
  return data;
}

export async function getAdminPharmacyBranding(
  pharmacyId: string,
): Promise<PharmacyBranding> {
  return fetchJson<PharmacyBranding>(
    `/api/admin/pharmacies/${encodeURIComponent(pharmacyId)}/branding`,
  );
}

export async function updateAdminPharmacyBranding(
  pharmacyId: string,
  body: PharmacyBranding,
): Promise<void> {
  await fetchJson(
    `/api/admin/pharmacies/${encodeURIComponent(pharmacyId)}/branding`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export async function uploadAdminPharmacyLogo(
  pharmacyId: string,
  file: File,
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(
    `/api/admin/pharmacies/${encodeURIComponent(pharmacyId)}/branding/upload`,
    { method: "POST", body: formData },
  );
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
