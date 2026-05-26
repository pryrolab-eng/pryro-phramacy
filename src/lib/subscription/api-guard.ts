import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "../../../supabase/service";
import {
  entitlementErrorResponse,
  requirePharmacyEntitlement,
} from "./assert-entitlement";

export async function getRequestPharmacyId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("pharmacy_users")
    .select("pharmacy_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  return data?.pharmacy_id ?? null;
}

export async function guardPharmacyFeature(
  supabase: SupabaseClient,
  userId: string,
  options: {
    feature?: string;
    limit?: "users" | "branches";
    branchId?: string;
    consumeTransaction?: boolean;
  },
): Promise<{ pharmacyId: string; admin: SupabaseClient }> {
  const pharmacyId = await getRequestPharmacyId(supabase, userId);
  if (!pharmacyId) {
    throw new Error("Pharmacy not found");
  }
  const admin = createServiceClient();
  await requirePharmacyEntitlement({
    admin,
    pharmacyId,
    feature: options.feature,
    limit: options.limit,
    branchId: options.branchId,
    consumeTransaction: options.consumeTransaction,
  });
  return { pharmacyId, admin };
}

export function handleEntitlementRouteError(err: unknown) {
  const mapped = entitlementErrorResponse(err);
  if (mapped) {
    return Response.json(mapped.body, { status: mapped.status });
  }
  return null;
}
