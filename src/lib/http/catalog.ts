import { fetchJson } from "./client";

/** Tenant-scoped category list (used on admin dashboard for counts, etc.). */
export const pharmacyCategoriesCatalogQueryKey = ["categories", "catalog"] as const;

export async function getPharmacyCategoriesCatalog(): Promise<unknown[]> {
  const data = await fetchJson<unknown>("/api/categories");
  return Array.isArray(data) ? data : [];
}

type CreateCategoryResponse = {
  success: boolean;
  error?: string;
  category?: { id: string; name: string };
};

/** `POST /api/categories` — create a pharmacy category. */
export async function createPharmacyCategory(
  name: string,
): Promise<{ success: boolean; categoryId?: string; error?: string }> {
  const result = await fetchJson<CreateCategoryResponse>("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name.trim() }),
  });
  return {
    success: result.success,
    categoryId: result.category?.id,
    error: result.error,
  };
}
