import { prisma } from "@/lib/db/prisma";
import type { CategoryCatalogItem } from "@/lib/pharmacy/category-catalog";

const SCOPE_RANK: Record<CategoryCatalogItem["scope"], number> = {
  global: 0,
  platform: 1,
  pharmacy: 2,
};

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
  if (row.is_active === false) return;
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

export async function listCategoryCatalogFromDb(
  pharmacyId: string,
): Promise<CategoryCatalogItem[]> {
  const [platformRows, pharmacyRows, globalRows] = await Promise.all([
    prisma.categories.findMany({
      where: { pharmacy_id: null, is_active: { not: false } },
      select: { id: true, name: true, description: true, is_active: true },
      orderBy: { name: "asc" },
    }),
    prisma.categories.findMany({
      where: { pharmacy_id: pharmacyId, is_active: { not: false } },
      select: { id: true, name: true, description: true, is_active: true },
      orderBy: { name: "asc" },
    }),
    prisma.global_categories.findMany({
      where: { is_active: { not: false } },
      select: { id: true, name: true, description: true, is_active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const byName = new Map<string, CategoryCatalogItem>();
  for (const row of globalRows) upsertCategory(byName, row, "global");
  for (const row of platformRows) upsertCategory(byName, row, "platform");
  for (const row of pharmacyRows) upsertCategory(byName, row, "pharmacy");

  return Array.from(byName.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
}

export async function createPharmacyCategoryFromDb(input: {
  pharmacyId: string;
  name: string;
  description?: string;
}) {
  return prisma.categories.create({
    data: {
      pharmacy_id: input.pharmacyId,
      name: input.name,
      description: input.description ?? "",
      is_active: true,
    },
  });
}

export async function updatePharmacyCategoryFromDb(input: {
  pharmacyId: string;
  categoryId: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}) {
  return prisma.categories.updateMany({
    where: {
      id: input.categoryId,
      pharmacy_id: input.pharmacyId,
    },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
      updated_at: new Date(),
    },
  });
}

export async function deletePharmacyCategoryFromDb(input: {
  pharmacyId: string;
  categoryId: string;
}) {
  return prisma.categories.deleteMany({
    where: {
      id: input.categoryId,
      pharmacy_id: input.pharmacyId,
    },
  });
}
