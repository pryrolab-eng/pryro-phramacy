import { resolveActivePharmacyId } from "@/lib/pharmacy/active-pharmacy";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";
import { resolvePharmacyEntitlements } from "@/lib/subscription/lifecycle/entitlements";

/** When the active pharmacy is blocked, non–platform-admin users cannot mutate account settings. */
export async function assertActivePharmacyDashboardAccess(
  userId: string,
): Promise<void> {
  const isPlatformAdmin = await resolveIsAppPlatformAdmin(userId);
  if (isPlatformAdmin) return;

  const pharmacyId = await resolveActivePharmacyId(userId);
  if (!pharmacyId) return;

  const ent = await resolvePharmacyEntitlements(pharmacyId);
  if (!ent.isAccessAllowed) {
    throw new Error("ACCESS_BLOCKED");
  }
}
