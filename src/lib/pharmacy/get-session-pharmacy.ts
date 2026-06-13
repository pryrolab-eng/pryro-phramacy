import {
  storeFindFirstActiveMembership,
  storeFindMembershipAtPharmacy,
} from "@/lib/db/pharmacy-users-store";
import { storeGetUserActiveContext } from "@/lib/db/public-users-store";

/** Active pharmacy for the current user. */
export async function requireUserPharmacyId(userId: string): Promise<string> {
  const pharmacyId = await resolveUserPharmacyId(userId);
  if (!pharmacyId) {
    throw new Error("Pharmacy not found");
  }
  return pharmacyId;
}

export async function resolveUserPharmacyId(
  userId: string,
): Promise<string | null> {
  const ctx = await storeGetUserActiveContext(userId);
  if (ctx?.active_pharmacy_id) {
    const membership = await storeFindMembershipAtPharmacy(
      userId,
      ctx.active_pharmacy_id,
    );
    if (membership) return ctx.active_pharmacy_id;
  }
  const first = await storeFindFirstActiveMembership(userId);
  return first?.pharmacy_id ?? null;
}

/** Resolves the user's active pharmacy or throws. */
export async function requireSessionPharmacyId(userId: string): Promise<string> {
  return requireUserPharmacyId(userId);
}
