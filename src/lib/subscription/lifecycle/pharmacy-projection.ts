import { syncPharmacySubscriptionProjectionFromDb } from "@/lib/db/pharmacy-projection";
import type { EntitlementPlan } from "./types";

/**
 * Denormalized cache on pharmacies — NOT authoritative.
 * Call after every lifecycle transition.
 */
export async function syncPharmacySubscriptionProjection(
  pharmacyId: string,
  projection: {
    plan: EntitlementPlan | null;
    expiresAt: string | null;
    accessAllowed: boolean;
  },
): Promise<void> {
  return syncPharmacySubscriptionProjectionFromDb(pharmacyId, projection);
}
