export type PlanPriceInput = {
  price: number | string | null | undefined;
};

export function planPriceNumber(plan: PlanPriceInput): number {
  const n = Number(plan.price ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function isSameTier(
  current: PlanPriceInput,
  target: PlanPriceInput
): boolean {
  return planPriceNumber(current) === planPriceNumber(target);
}

export function isUpgrade(
  current: PlanPriceInput,
  target: PlanPriceInput
): boolean {
  return planPriceNumber(target) > planPriceNumber(current);
}

export function isDowngrade(
  current: PlanPriceInput,
  target: PlanPriceInput
): boolean {
  return planPriceNumber(target) < planPriceNumber(current);
}
