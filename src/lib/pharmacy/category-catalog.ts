import { listCategoryCatalogFromDb } from "@/lib/db/categories-pharmacy";

export type CategoryCatalogItem = {
  id: string;
  name: string;
  description: string | null;
  /** Where the option came from (for debugging / future UI badges). */
  scope: "pharmacy" | "platform" | "global";
};

/** Platform + legacy global + pharmacy-specific categories for product forms. */
export async function listCategoryCatalog(
  pharmacyId: string,
): Promise<CategoryCatalogItem[]> {
  return listCategoryCatalogFromDb(pharmacyId);
}
