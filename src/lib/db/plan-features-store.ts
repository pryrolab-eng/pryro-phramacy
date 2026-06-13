import {
  createPlatformFeatureFromDb,
  listPlatformFeaturesFromDb,
  loadPlanFeatureKeysFromDb,
  syncPlanFeaturesFromDb,
  syncPlanMarketingFeaturesFromDb,
  updatePlatformFeatureFromDb,
  type PlatformFeatureCreateInput,
} from "@/lib/db/plan-features";
import type { PlatformFeatureRow } from "@/lib/subscription/plan-features";

export async function storeListPlatformFeatures(options?: {
  includeInactive?: boolean;
}): Promise<PlatformFeatureRow[]> {
  return listPlatformFeaturesFromDb(options);
}

export async function storeLoadPlanFeatureKeys(
  planId: string,
): Promise<string[]> {
  return loadPlanFeatureKeysFromDb(planId);
}

export async function storeCreatePlatformFeature(
  input: PlatformFeatureCreateInput,
) {
  return createPlatformFeatureFromDb(input);
}

export async function storeUpdatePlatformFeature(
  key: string,
  input: {
    displayName?: string;
    description?: string | null;
    group?: string;
    featureType?: string;
    limitColumn?: string | null;
    navRoutes?: string[];
    sortOrder?: number;
    isActive?: boolean;
  },
) {
  return updatePlatformFeatureFromDb(key, input);
}

export async function storeSyncPlanFeatures(
  planId: string,
  featureKeys: string[],
): Promise<void> {
  await syncPlanFeaturesFromDb(planId, featureKeys);
}

export async function storeSyncPlanMarketingFeatures(
  planId: string,
  featureKeys: string[],
): Promise<string[]> {
  return syncPlanMarketingFeaturesFromDb(planId, featureKeys);
}
