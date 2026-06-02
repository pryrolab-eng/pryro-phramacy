import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveActivePharmacyId } from "@/lib/pharmacy/active-pharmacy";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";
import { resolvePharmacyEntitlements } from "@/lib/subscription/lifecycle/entitlements";

/** When the active pharmacy is blocked, non–platform-admin users cannot mutate account settings. */
export async function assertActivePharmacyDashboardAccess(
  userClient: SupabaseClient,
  admin: SupabaseClient,
  userId: string,
): Promise<void> {
  const isPlatformAdmin = await resolveIsAppPlatformAdmin(
    userClient,
    userId,
    null,
  );
  if (isPlatformAdmin) return;

  const pharmacyId = await resolveActivePharmacyId(admin, userId);
  if (!pharmacyId) return;

  const ent = await resolvePharmacyEntitlements(admin, pharmacyId);
  if (!ent.isAccessAllowed) {
    throw new Error("ACCESS_BLOCKED");
  }
}
