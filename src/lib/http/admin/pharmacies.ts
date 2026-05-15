import { ensureApiSuccess, fetchJson } from "../client";

export const adminPharmaciesQueryKey = ["admin", "pharmacies"] as const;

export type AdminPharmacyRow = Record<string, unknown> & {
  id: string;
  name?: string;
  email?: string;
  created_at?: string;
  subscription_plan?: string;
  subscription_expires_at?: string | null;
};

export async function getAdminPharmacies(): Promise<AdminPharmacyRow[]> {
  const data = await fetchJson<unknown>("/api/admin/pharmacies");
  return Array.isArray(data) ? (data as AdminPharmacyRow[]) : [];
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
  const data = await fetchJson<{ success: boolean; error?: string }>(
    `/api/admin/pharmacies/${id}`,
    { method: "DELETE" },
  );
  ensureApiSuccess(data, "Failed to delete pharmacy");
}
