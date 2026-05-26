import type { SupabaseClient } from "@supabase/supabase-js";
import { planNameToEnum } from "../plan-enum";
import type { EntitlementPlan } from "./types";

/**
 * Denormalized cache on pharmacies — NOT authoritative.
 * Call after every lifecycle transition.
 */
export async function syncPharmacySubscriptionProjection(
  admin: SupabaseClient,
  pharmacyId: string,
  projection: {
    plan: EntitlementPlan | null;
    expiresAt: string | null;
    accessAllowed: boolean;
  }
): Promise<void> {
  const planEnum = projection.plan
    ? planNameToEnum(projection.plan.name)
    : "trial";

  await admin
    .from("pharmacies")
    .update({
      subscription_plan: planEnum,
      subscription_expires_at: projection.expiresAt,
      /** Plan tier lives in subscription_plan + catalog — status is access only. */
      status: projection.accessAllowed ? "active" : "suspended",
      updated_at: new Date().toISOString(),
    })
    .eq("id", pharmacyId);
}
