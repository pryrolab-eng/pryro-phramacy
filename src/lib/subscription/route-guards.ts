import {
  getRequestPharmacyId,
  guardPharmacyFeatureForUser,
  handleEntitlementRouteError,
} from "./api-guard";
import { requirePharmacyEntitlement } from "./assert-entitlement";

export async function guardInventoryAccessForUser(
  userId: string,
): Promise<void> {
  await guardPharmacyFeatureForUser(userId, {
    feature: "inventory.access",
  });
}

export async function guardReportsAccessForUser(userId: string): Promise<void> {
  await guardPharmacyFeatureForUser(userId, {
    feature: "reports.view",
  });
}

export async function guardPosInsuranceForUser(userId: string): Promise<void> {
  const pharmacyId = await getRequestPharmacyId(userId);
  if (!pharmacyId) throw new Error("Pharmacy not found");
  await requirePharmacyEntitlement({
    pharmacyId,
    feature: "pos.insurance",
  });
}

export function entitlementRouteResponse(err: unknown) {
  return handleEntitlementRouteError(err);
}
