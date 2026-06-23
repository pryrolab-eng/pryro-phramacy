import {
  displayNamesForFeatureKeys,
  loadPlanFeatureKeys,
} from "./plan-features";

export async function enrichPlansWithCatalogFeatures<
  T extends { id: string; features?: string[] | null },
>(plans: T[]): Promise<(T & { feature_keys: string[] })[]> {
  const enriched = await Promise.all(
    plans.map(async (plan) => {
      const keys = await loadPlanFeatureKeys(plan.id);
      if (keys.length === 0) {
        return { ...plan, feature_keys: [] as string[] };
      }
      const labels = await displayNamesForFeatureKeys(keys);
      return {
        ...plan,
        feature_keys: keys,
        features: labels.length > 0 ? labels : plan.features,
      };
    }),
  );
  return enriched;
}
