export type DisplaySubscriptionPlan = {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  is_popular: boolean;
};

/** Normalize a subscription_plans row from Supabase for UI display. */
export function normalizeSubscriptionPlanRow(
  row: Record<string, unknown>
): DisplaySubscriptionPlan {
  const rawFeatures = row.features;
  let features: string[] = [];
  if (Array.isArray(rawFeatures)) {
    features = rawFeatures.map((f) => String(f));
  } else if (typeof rawFeatures === "string") {
    try {
      const parsed = JSON.parse(rawFeatures) as unknown;
      features = Array.isArray(parsed)
        ? parsed.map((f) => String(f))
        : rawFeatures
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean);
    } catch {
      features = rawFeatures
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);
    }
  }

  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    price: Number(row.price ?? 0),
    period: String(row.period ?? "per month"),
    features,
    is_popular: Boolean(row.is_popular),
  };
}

export function parsePlanPriceInput(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}
