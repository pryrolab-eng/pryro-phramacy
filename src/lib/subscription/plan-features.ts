import {
  storeListPlatformFeatures,
  storeLoadPlanFeatureKeys,
  storeSyncPlanFeatures,
  storeSyncPlanMarketingFeatures,
} from "@/lib/db/plan-features-store";
import { displayNamesForFeatureKeysFromDb } from "@/lib/db/plan-features";
import { REQUIRED_MAIN_PLAN_FEATURE_KEYS } from "./feature-catalog";

export type PlatformFeatureRow = {
  key: string;
  display_name: string;
  description: string | null;
  group: string;
  feature_type: "boolean" | "limit" | "metered";
  limit_column: string | null;
  nav_routes: string[];
  api_routes: unknown;
  sort_order: number;
  is_active: boolean;
};

export async function listPlatformFeatures(options?: {
  includeInactive?: boolean;
}): Promise<PlatformFeatureRow[]> {
  return storeListPlatformFeatures(options);
}

export async function loadPlanFeatureKeys(planId: string): Promise<string[]> {
  return storeLoadPlanFeatureKeys(planId);
}

export async function syncPlanFeatures(
  planId: string,
  featureKeys: string[],
): Promise<void> {
  await storeSyncPlanFeatures(planId, featureKeys);
}

export async function displayNamesForFeatureKeys(keys: string[]): Promise<string[]> {
  if (keys.length === 0) return [];
  return displayNamesForFeatureKeysFromDb(keys);
}

export async function syncPlanMarketingFeatures(
  planId: string,
  featureKeys: string[],
): Promise<string[]> {
  return storeSyncPlanMarketingFeatures(planId, featureKeys);
}

export function validateRequiredMainPlanKeys(featureKeys: string[]): string | null {
  for (const required of REQUIRED_MAIN_PLAN_FEATURE_KEYS) {
    if (!featureKeys.includes(required)) {
      return `Main plans must include feature: ${required}`;
    }
  }
  return null;
}
