import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "../../../supabase/service";
import {
  getRequestPharmacyId,
  guardPharmacyFeature,
  handleEntitlementRouteError,
} from "./api-guard";
import { requirePharmacyEntitlement } from "./assert-entitlement";

export async function guardInventoryAccess(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  await guardPharmacyFeature(supabase, userId, {
    feature: "inventory.access",
  });
}

export async function guardReportsAccess(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  await guardPharmacyFeature(supabase, userId, {
    feature: "reports.view",
  });
}

export async function guardPosInsurance(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const pharmacyId = await getRequestPharmacyId(supabase, userId);
  if (!pharmacyId) throw new Error("Pharmacy not found");
  const admin = createServiceClient();
  await requirePharmacyEntitlement({
    admin,
    pharmacyId,
    feature: "pos.insurance",
  });
}

export function entitlementRouteResponse(err: unknown) {
  return handleEntitlementRouteError(err);
}
