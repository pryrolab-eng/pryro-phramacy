import { fetchJson } from "./client";

/** Tenant-scoped category list (used on admin dashboard for counts, etc.). */
export const pharmacyCategoriesCatalogQueryKey = ["categories", "catalog"] as const;

export async function getPharmacyCategoriesCatalog(): Promise<unknown[]> {
  const data = await fetchJson<unknown>("/api/categories");
  return Array.isArray(data) ? data : [];
}
