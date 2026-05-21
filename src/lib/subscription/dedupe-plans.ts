import type { DisplaySubscriptionPlan } from "./normalize-plan";

export function normalizePlanName(name: string): string {
  return String(name ?? "").trim().toLowerCase();
}

type PlanRow = {
  id: string;
  name: string;
  price?: number | string | null;
  polar_product_id?: string | null;
  is_active?: boolean | null;
  updated_at?: string | null;
  created_at?: string | null;
};

/** Prefer row with Polar link, then most recently updated, then oldest created. */
export function planRowSortScore(row: PlanRow): number {
  let score = 0;
  if (row.polar_product_id) score += 1000;
  if (row.is_active !== false) score += 100;
  if (row.updated_at) score += 1;
  return score;
}

export function comparePlanRows(a: PlanRow, b: PlanRow): number {
  const scoreDiff = planRowSortScore(b) - planRowSortScore(a);
  if (scoreDiff !== 0) return scoreDiff;
  const aUpdated = a.updated_at ? Date.parse(a.updated_at) : 0;
  const bUpdated = b.updated_at ? Date.parse(b.updated_at) : 0;
  if (bUpdated !== aUpdated) return bUpdated - aUpdated;
  const aCreated = a.created_at ? Date.parse(a.created_at) : 0;
  const bCreated = b.created_at ? Date.parse(b.created_at) : 0;
  if (aCreated !== bCreated) return aCreated - bCreated;
  return String(a.id).localeCompare(String(b.id));
}

/** One canonical plan per name (case-insensitive). */
export function dedupeSubscriptionPlansByName<T extends PlanRow>(plans: T[]): T[] {
  const byName = new Map<string, T[]>();
  for (const plan of plans) {
    const key = normalizePlanName(plan.name);
    if (!key) continue;
    const list = byName.get(key) ?? [];
    list.push(plan);
    byName.set(key, list);
  }

  const result: T[] = [];
  for (const group of byName.values()) {
    group.sort(comparePlanRows);
    result.push(group[0]);
  }

  return result.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0));
}

export function dedupeDisplayPlans(
  plans: DisplaySubscriptionPlan[]
): DisplaySubscriptionPlan[] {
  return dedupeSubscriptionPlansByName(plans);
}

export type PlanDuplicateGroup = {
  name: string;
  keeperId: string;
  duplicateIds: string[];
};

/** Groups with more than one active row per name. */
export function findDuplicatePlanGroups<T extends PlanRow>(
  plans: T[],
  options?: { activeOnly?: boolean }
): PlanDuplicateGroup[] {
  const activeOnly = options?.activeOnly ?? true;
  const filtered = activeOnly
    ? plans.filter((p) => p.is_active !== false)
    : plans;

  const byName = new Map<string, T[]>();
  for (const plan of filtered) {
    const key = normalizePlanName(plan.name);
    if (!key) continue;
    const list = byName.get(key) ?? [];
    list.push(plan);
    byName.set(key, list);
  }

  const groups: PlanDuplicateGroup[] = [];
  for (const [name, list] of byName) {
    if (list.length <= 1) continue;
    list.sort(comparePlanRows);
    const keeper = list[0];
    groups.push({
      name,
      keeperId: keeper.id,
      duplicateIds: list.slice(1).map((p) => p.id),
    });
  }
  return groups;
}
