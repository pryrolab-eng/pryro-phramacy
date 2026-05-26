import type { SupabaseClient } from "@supabase/supabase-js";
import {
  displayNamesForFeatureKeys,
  loadPlanFeatureKeys,
} from "./plan-features";

export async function enrichPlansWithCatalogFeatures<
  T extends { id: string; features?: string[] | null },
>(admin: SupabaseClient, plans: T[]): Promise<(T & { feature_keys: string[] })[]> {
  const enriched = await Promise.all(
    plans.map(async (plan) => {
      const keys = await loadPlanFeatureKeys(admin, plan.id);
      if (keys.length === 0) {
        return { ...plan, feature_keys: [] as string[] };
      }
      const labels = await displayNamesForFeatureKeys(admin, keys);
      return {
        ...plan,
        feature_keys: keys,
        features: labels.length > 0 ? labels : plan.features,
      };
    }),
  );
  return enriched;
}
