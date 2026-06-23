import { prisma } from "@/lib/db/prisma";
import type { PlatformFeatureRow } from "@/lib/subscription/plan-features";

export async function listPlatformFeaturesFromDb(options?: {
  includeInactive?: boolean;
}): Promise<PlatformFeatureRow[]> {
  const rows = await prisma.platform_features.findMany({
    where: options?.includeInactive ? undefined : { is_active: true },
    orderBy: [{ group: "asc" }, { sort_order: "asc" }],
  });

  return rows.map((row) => ({
    key: row.key,
    display_name: row.display_name,
    description: row.description,
    group: row.group,
    feature_type: row.feature_type as PlatformFeatureRow["feature_type"],
    limit_column: row.limit_column,
    nav_routes: row.nav_routes ?? [],
    api_routes: row.api_routes,
    sort_order: row.sort_order,
    is_active: row.is_active,
  }));
}

export async function loadPlanFeatureKeysFromDb(
  planId: string,
): Promise<string[]> {
  const rows = await prisma.plan_features.findMany({
    where: { plan_id: planId, enabled: true },
    select: { feature_key: true },
  });

  const keys = rows.map((row) => row.feature_key);
  if (keys.length === 0) return [];

  const meta = await prisma.platform_features.findMany({
    where: { key: { in: keys } },
    select: { key: true, feature_type: true },
  });

  const booleanKeys = new Set(
    meta.filter((row) => row.feature_type === "boolean").map((row) => row.key),
  );
  return keys.filter((key) => booleanKeys.has(key));
}

export type PlatformFeatureCreateInput = {
  key: string;
  displayName: string;
  description?: string | null;
  group?: string;
  featureType?: string;
  limitColumn?: string | null;
  navRoutes?: string[];
  sortOrder?: number;
  isActive?: boolean;
};

export async function createPlatformFeatureFromDb(
  input: PlatformFeatureCreateInput,
) {
  return prisma.platform_features.create({
    data: {
      key: input.key,
      display_name: input.displayName,
      description: input.description ?? null,
      group: input.group ?? "General",
      feature_type: input.featureType ?? "boolean",
      limit_column: input.limitColumn ?? null,
      nav_routes: input.navRoutes ?? [],
      sort_order: input.sortOrder ?? 0,
      is_active: input.isActive ?? true,
    },
  });
}

export async function updatePlatformFeatureFromDb(
  key: string,
  input: Partial<{
    displayName: string;
    description: string | null;
    group: string;
    featureType: string;
    limitColumn: string | null;
    navRoutes: string[];
    sortOrder: number;
    isActive: boolean;
  }>,
) {
  return prisma.platform_features.update({
    where: { key },
    data: {
      ...(input.displayName !== undefined
        ? { display_name: input.displayName }
        : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.group !== undefined ? { group: input.group } : {}),
      ...(input.featureType !== undefined
        ? { feature_type: input.featureType }
        : {}),
      ...(input.limitColumn !== undefined
        ? { limit_column: input.limitColumn }
        : {}),
      ...(input.navRoutes !== undefined ? { nav_routes: input.navRoutes } : {}),
      ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
      ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
      updated_at: new Date(),
    },
  });
}

export async function displayNamesForFeatureKeysFromDb(
  keys: string[],
): Promise<string[]> {
  if (keys.length === 0) return [];

  const rows = await prisma.platform_features.findMany({
    where: { key: { in: keys } },
    orderBy: { sort_order: "asc" },
    select: { display_name: true },
  });

  return rows.map((row) => row.display_name);
}

export async function syncPlanFeaturesFromDb(
  planId: string,
  featureKeys: string[],
): Promise<void> {
  const unique = Array.from(new Set(featureKeys.filter(Boolean)));

  const booleanFeatures = await prisma.platform_features.findMany({
    where: {
      feature_type: "boolean",
      key: { in: unique.length ? unique : ["__none__"] },
    },
    select: { key: true },
  });

  const validKeys = new Set(booleanFeatures.map((row) => row.key));
  const toInsert = unique.filter((key) => validKeys.has(key));

  await prisma.plan_features.deleteMany({ where: { plan_id: planId } });
  if (toInsert.length === 0) return;

  const labelRows = await prisma.platform_features.findMany({
    where: { key: { in: toInsert } },
    select: { key: true, display_name: true },
  });
  const labelByKey = new Map(
    labelRows.map((row) => [row.key, row.display_name]),
  );

  await prisma.plan_features.createMany({
    data: toInsert.map((feature_key) => ({
      plan_id: planId,
      feature_key,
      feature_label: labelByKey.get(feature_key) ?? feature_key,
      enabled: true,
    })),
  });
}

export async function syncPlanMarketingFeaturesFromDb(
  planId: string,
  featureKeys: string[],
): Promise<string[]> {
  const labels = await displayNamesForFeatureKeysFromDb(featureKeys);
  await prisma.subscription_plans.update({
    where: { id: planId },
    data: { features: labels, updated_at: new Date() },
  });
  return labels;
}
