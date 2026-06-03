import type { SupabaseClient } from "@supabase/supabase-js";

export type CategoryCatalogItem = {
  id: string;
  name: string;
  description: string | null;
  /** Where the option came from (for debugging / future UI badges). */
  scope: "pharmacy" | "platform" | "global";
};

const SCOPE_RANK: Record<CategoryCatalogItem["scope"], number> = {
  global: 0,
  platform: 1,
  pharmacy: 2,
};

function isActive(row: { is_active?: boolean | null }): boolean {
  return row.is_active !== false;
}

function upsertCategory(
  map: Map<string, CategoryCatalogItem>,
  row: {
    id: string;
    name: string;
    description?: string | null;
    is_active?: boolean | null;
  },
  scope: CategoryCatalogItem["scope"],
) {
  if (!isActive(row)) return;
  const name = row.name?.trim();
  if (!name) return;
  const key = name.toLowerCase();
  const next: CategoryCatalogItem = {
    id: row.id,
    name,
    description: row.description ?? null,
    scope,
  };
  const existing = map.get(key);
  if (!existing || SCOPE_RANK[scope] >= SCOPE_RANK[existing.scope]) {
    map.set(key, next);
  }
}

/** Platform + legacy global + pharmacy-specific categories for product forms. */
export async function listCategoryCatalog(
  admin: SupabaseClient,
  pharmacyId: string,
): Promise<CategoryCatalogItem[]> {
  const [platformRes, pharmacyRes, globalRes] = await Promise.all([
    admin
      .from("categories")
      .select("id, name, description, is_active")
      .is("pharmacy_id", null)
      .order("name", { ascending: true }),
    admin
      .from("categories")
      .select("id, name, description, is_active")
      .eq("pharmacy_id", pharmacyId)
      .order("name", { ascending: true }),
    admin
      .from("global_categories")
      .select("id, name, description, is_active")
      .order("name", { ascending: true }),
  ]);

  if (platformRes.error) throw new Error(platformRes.error.message);
  if (pharmacyRes.error) throw new Error(pharmacyRes.error.message);
  if (globalRes.error) throw new Error(globalRes.error.message);

  const byName = new Map<string, CategoryCatalogItem>();

  for (const row of globalRes.data ?? []) {
    upsertCategory(byName, row, "global");
  }
  for (const row of platformRes.data ?? []) {
    upsertCategory(byName, row, "platform");
  }
  for (const row of pharmacyRes.data ?? []) {
    upsertCategory(byName, row, "pharmacy");
  }

  return Array.from(byName.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
}
