import type { medication_category } from "@prisma/client";
import type { CategoryCatalogItem } from "@/lib/pharmacy/category-catalog";
import { prisma } from "@/lib/db/prisma";
import {
  createPharmacyCategoryFromDb,
  listCategoryCatalogFromDb,
} from "@/lib/db/categories-pharmacy";
import { resolveMedicationCategoryEnum } from "@/lib/pharmacy/medication-category";

export type MedicationCategoryRef = {
  categoryId: string | null;
  globalCategoryId: string | null;
  displayName: string;
  legacyEnum: medication_category;
};

const GLOBAL_PREFIX = "global:";
const CATEGORY_PREFIX = "category:";

export function encodeCategoryCatalogValue(item: Pick<CategoryCatalogItem, "scope" | "id">): string {
  return item.scope === "global" ? `${GLOBAL_PREFIX}${item.id}` : `${CATEGORY_PREFIX}${item.id}`;
}

export function decodeCategoryCatalogValue(
  value: string,
): { scope: "global" | "category"; id: string } | null {
  const trimmed = value.trim();
  if (trimmed.startsWith(GLOBAL_PREFIX)) {
    const id = trimmed.slice(GLOBAL_PREFIX.length);
    return id ? { scope: "global", id } : null;
  }
  if (trimmed.startsWith(CATEGORY_PREFIX)) {
    const id = trimmed.slice(CATEGORY_PREFIX.length);
    return id ? { scope: "category", id } : null;
  }
  return null;
}

export function legacyEnumLabel(category: medication_category | null | undefined): string {
  switch (category) {
    case "prescription":
      return "Prescription";
    case "controlled":
      return "Controlled";
    case "supplement":
      return "Supplements";
    case "medical_device":
      return "Medical Device";
    case "otc":
    default:
      return "OTC";
  }
}

export function medicationCategoryDisplayName(input: {
  category?: medication_category | string | null;
  categories?: { name: string } | null;
  global_categories?: { name: string } | null;
}): string {
  if (input.global_categories?.name) return input.global_categories.name;
  if (input.categories?.name) return input.categories.name;
  if (typeof input.category === "string" && input.category.includes("_")) {
    return legacyEnumLabel(input.category as medication_category);
  }
  if (typeof input.category === "string" && input.category) return input.category;
  return legacyEnumLabel(input.category as medication_category | null | undefined);
}

export async function resolveMedicationCategoryRef(
  pharmacyId: string,
  input: string,
  options?: { createIfMissing?: boolean },
): Promise<MedicationCategoryRef> {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Category is required");
  }

  const decoded = decodeCategoryCatalogValue(trimmed);
  if (decoded) {
    if (decoded.scope === "global") {
      const row = await prisma.global_categories.findFirst({
        where: { id: decoded.id, is_active: { not: false } },
        select: { id: true, name: true },
      });
      if (!row) throw new Error("Global category not found");
      return {
        categoryId: null,
        globalCategoryId: row.id,
        displayName: row.name,
        legacyEnum: resolveMedicationCategoryEnum(row.name) as medication_category,
      };
    }

    const row = await prisma.categories.findFirst({
      where: {
        id: decoded.id,
        is_active: { not: false },
        OR: [{ pharmacy_id: pharmacyId }, { pharmacy_id: null }],
      },
      select: { id: true, name: true },
    });
    if (!row) throw new Error("Category not found");
    return {
      categoryId: row.id,
      globalCategoryId: null,
      displayName: row.name,
      legacyEnum: resolveMedicationCategoryEnum(row.name) as medication_category,
    };
  }

  const catalog = await listCategoryCatalogFromDb(pharmacyId);
  const match = catalog.find(
    (row) => row.name.localeCompare(trimmed, undefined, { sensitivity: "accent" }) === 0,
  );
  if (match) {
    return {
      categoryId: match.scope === "global" ? null : match.id,
      globalCategoryId: match.scope === "global" ? match.id : null,
      displayName: match.name,
      legacyEnum: resolveMedicationCategoryEnum(match.name) as medication_category,
    };
  }

  if (!options?.createIfMissing) {
    throw new Error(`Unknown category "${trimmed}". Pick a catalog category or create one first.`);
  }

  const created = await createPharmacyCategoryFromDb({
    pharmacyId,
    name: trimmed,
  });

  return {
    categoryId: created.id,
    globalCategoryId: null,
    displayName: created.name,
    legacyEnum: resolveMedicationCategoryEnum(created.name) as medication_category,
  };
}

export function medicationCategoryWriteData(ref: MedicationCategoryRef) {
  return {
    category_id: ref.categoryId,
    global_category_id: ref.globalCategoryId,
    category: ref.legacyEnum,
    requires_prescription:
      ref.legacyEnum === "prescription" || ref.legacyEnum === "controlled",
  };
}
