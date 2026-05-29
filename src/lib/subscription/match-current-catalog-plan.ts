import { normalizePlanKey } from "@/lib/admin/plan-stats";

export type ActivePlanRef = {
  id: string | null;
  name: string;
  price?: number;
};

export function normalizePlanName(name: string | null | undefined): string {
  return String(name ?? "").trim().toLowerCase();
}

/** True when a catalog row is the pharmacy's effective main plan. */
export function catalogPlanMatchesActive(
  plan: { id: string; name: string },
  active: ActivePlanRef | null | undefined,
): boolean {
  if (!active) return false;

  if (active.id && plan.id && active.id === plan.id) return true;

  const planName = normalizePlanName(plan.name);
  const activeName = normalizePlanName(active.name);
  if (planName && activeName && planName === activeName) return true;

  // Legacy enum label from pharmacies.subscription_plan (skip trial bucket).
  const enumKey = normalizePlanKey(plan.name);
  if (activeName && enumKey === activeName && activeName !== "trial") {
    return true;
  }

  return false;
}

export function findCurrentCatalogPlan<T extends { id: string; name: string }>(
  plans: T[],
  active: ActivePlanRef | null | undefined,
): T | null {
  if (!active || plans.length === 0) return null;
  if (active.id) {
    const byId = plans.find((p) => p.id === active.id);
    if (byId) return byId;
  }
  return plans.find((p) => catalogPlanMatchesActive(p, active)) ?? null;
}

export function resolveCurrentPlanPrice(
  plans: { id: string; name: string; price: number }[],
  active: ActivePlanRef | null | undefined,
): number {
  const match = findCurrentCatalogPlan(plans, active);
  if (match) return match.price;
  return active?.price ?? 0;
}
