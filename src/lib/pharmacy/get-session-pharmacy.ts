import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveActivePharmacyId } from "@/lib/pharmacy/active-pharmacy";
import { createServiceClient } from "../../../supabase/service";

/** Resolves the user's active pharmacy or throws. */
export async function requireSessionPharmacyId(
  _supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const admin = createServiceClient();
  const pharmacyId = await resolveActivePharmacyId(admin, userId);
  if (!pharmacyId) {
    throw new Error("Pharmacy not found");
  }
  return pharmacyId;
}
