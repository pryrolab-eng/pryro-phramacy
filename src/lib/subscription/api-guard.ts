import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { resolveActivePharmacyContext } from "@/lib/pharmacy/active-pharmacy";
import { assertBranchAllowedForUser } from "@/lib/pharmacy/staff-branch-access";
import {
  entitlementErrorResponse,
  requirePharmacyEntitlement,
} from "./assert-entitlement";

export type GuardPharmacyFeatureOptions = {
  feature?: string;
  limit?: "users" | "branches";
  branchId?: string;
  consumeTransaction?: boolean;
};

export async function getRequestPharmacyId(userId: string): Promise<string | null> {
  try {
    return await requireUserPharmacyId(userId);
  } catch {
    return null;
  }
}

export async function guardPharmacyFeatureForUser(
  userId: string,
  options: GuardPharmacyFeatureOptions,
): Promise<{ pharmacyId: string }> {
  const pharmacyId = await getRequestPharmacyId(userId);
  if (!pharmacyId) {
    throw new Error("Pharmacy not found");
  }

  if (options.branchId) {
    const ctx = await resolveActivePharmacyContext(userId);
    await assertBranchAllowedForUser(
      userId,
      pharmacyId,
      ctx.role,
      options.branchId,
    );
  }

  await requirePharmacyEntitlement({
    pharmacyId,
    feature: options.feature,
    limit: options.limit,
    branchId: options.branchId,
    consumeTransaction: options.consumeTransaction,
  });

  return { pharmacyId };
}

export function handleEntitlementRouteError(err: unknown) {
  const mapped = entitlementErrorResponse(err);
  if (mapped) {
    return Response.json(mapped.body, { status: mapped.status });
  }
  return null;
}
