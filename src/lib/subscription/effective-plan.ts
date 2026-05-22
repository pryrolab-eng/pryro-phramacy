import type { SupabaseClient } from "@supabase/supabase-js";
import { resolvePharmacyEntitlements } from "./lifecycle/entitlements";

/** Plan label for UI — uses entitlement resolver (not pharmacies.subscription_plan). */
export async function getEffectiveSubscriptionLabel(
  supabase: SupabaseClient,
  pharmacyId: string,
  pharmacyPlanFallback?: string | null
): Promise<string> {
  const ent = await resolvePharmacyEntitlements(supabase, pharmacyId);
  if (ent.effectivePlan?.name) {
    return ent.effectivePlan.name.toLowerCase();
  }
  if (ent.effectivePlanLabel) {
    return ent.effectivePlanLabel;
  }
  return (pharmacyPlanFallback || "standard").toLowerCase();
}
