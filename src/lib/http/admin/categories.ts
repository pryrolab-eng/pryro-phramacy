import { ensureApiSuccess, fetchJson } from "../client";

export const adminCategoriesQueryKey = ["admin", "categories"] as const;

export type AdminCategoryRow = {
  id: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
  [key: string]: unknown;
};

export async function getAdminCategories(): Promise<AdminCategoryRow[]> {
  const data = await fetchJson<unknown>("/api/admin/categories");
  return Array.isArray(data) ? (data as AdminCategoryRow[]) : [];
}

export async function createAdminCategory(body: {
  name: string;
  description?: string;
}): Promise<{ category: AdminCategoryRow }> {
  const data = await fetchJson<{
    success: boolean;
    category?: AdminCategoryRow;
    error?: string;
  }>("/api/admin/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  ensureApiSuccess(data, "Failed to add category");
  if (!data.category) throw new Error("Invalid category response");
  return { category: data.category };
}

export async function updateAdminCategory(
  id: string,
  body: { name: string; description: string; status: string },
): Promise<void> {
  const data = await fetchJson<{ success: boolean; error?: string }>(
    `/api/admin/categories/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  ensureApiSuccess(data, "Failed to update category");
}

export async function deleteAdminCategory(id: string): Promise<void> {
  const data = await fetchJson<{ success: boolean; error?: string }>(
    `/api/admin/categories/${id}`,
    { method: "DELETE" },
  );
  ensureApiSuccess(data, "Failed to delete category");
}
