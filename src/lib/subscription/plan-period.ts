export type BillingPeriod = "monthly" | "yearly" | "free";

/** DB `period` label from billing cadence (never "free" — that breaks "/month" UI). */
export function periodLabelFromBilling(billing: BillingPeriod): string {
  if (billing === "yearly") return "per year";
  return "per month";
}

export function billingPeriodFromInput(
  price: number,
  chosen: "monthly" | "yearly",
): BillingPeriod {
  if (price === 0) return "free";
  return chosen;
}

/** Normalize legacy rows where `period` was set to "free". */
export function normalizePlanPeriodLabel(
  period: string | null | undefined,
  billingPeriod?: string | null,
  price?: number,
): string {
  const p = String(period ?? "").trim().toLowerCase();
  const bp = String(billingPeriod ?? "").trim().toLowerCase();

  if (bp === "yearly") return "per year";
  if (p === "per year" || p === "year") return "per year";
  if (p === "free" || p === "forever") return "per month";
  if (Number(price ?? 0) === 0) return "per month";
  if (p.startsWith("per ")) return period!.trim();
  return period?.trim() || "per month";
}

/** Suffix after price on marketing cards, e.g. "/month" or null for free. */
export function formatPlanPriceSuffix(options: {
  price: number;
  period?: string | null;
  billingPeriod?: string | null;
  pricingToggle?: "monthly" | "annually";
}): string | null {
  if (options.price === 0) return null;

  /** Annual toggle shows discounted per-month rate (20% off), not the lump-sum year total. */
  if (options.pricingToggle === "annually") return "/month";

  const bp = String(options.billingPeriod ?? "").toLowerCase();
  if (bp === "yearly") return "/year";

  const period = normalizePlanPeriodLabel(
    options.period,
    options.billingPeriod,
    options.price,
  );
  const unit = period.replace(/^per\s+/i, "").trim().toLowerCase();
  if (!unit || unit === "free" || unit === "forever") return "/month";
  return `/${unit}`;
}

export function billingPeriodLabel(billing?: string | null): string {
  const bp = String(billing ?? "monthly").toLowerCase();
  if (bp === "yearly") return "Yearly";
  if (bp === "free") return "Free tier";
  return "Monthly";
}
