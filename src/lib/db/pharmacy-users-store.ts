import {
  countActivePharmacyUsersFromDb,
  countAllPharmacyMembershipsFromDb,
  createPharmacyMembershipFromDb,
  findFirstActiveMembershipFromDb,
  findMembershipAtPharmacyFromDb,
  findMembershipIdByUserAndPharmacyFromDb,
  hasAnyActiveMembershipFromDb,
  listActiveMembershipsForUserFromDb,
  listActiveMembershipsWithPharmacyNameFromDb,
  upsertPharmacyMembershipFromDb,
  type PharmacyMembershipRow,
  type PharmacyMembershipWithName,
} from "@/lib/db/pharmacy-users";

export type { PharmacyMembershipRow, PharmacyMembershipWithName };

export async function storeCountActivePharmacyUsers(
  pharmacyId: string,
): Promise<number> {
  return countActivePharmacyUsersFromDb(pharmacyId);
}

export async function storeListActiveMembershipsForUser(
  userId: string,
): Promise<PharmacyMembershipRow[]> {
  return listActiveMembershipsForUserFromDb(userId);
}

export async function storeListActiveMembershipsWithPharmacyName(
  userId: string,
): Promise<PharmacyMembershipWithName[]> {
  return listActiveMembershipsWithPharmacyNameFromDb(userId);
}

export async function storeFindFirstActiveMembership(
  userId: string,
  options?: { roles?: string[] },
): Promise<PharmacyMembershipRow | null> {
  return findFirstActiveMembershipFromDb(userId, options);
}

export async function storeFindMembershipAtPharmacy(
  userId: string,
  pharmacyId: string,
): Promise<PharmacyMembershipRow | null> {
  return findMembershipAtPharmacyFromDb(userId, pharmacyId);
}

export async function storeFindMembershipIdByUserAndPharmacy(
  userId: string,
  pharmacyId: string,
): Promise<string | null> {
  return findMembershipIdByUserAndPharmacyFromDb(userId, pharmacyId);
}

export async function storeHasAnyActiveMembership(
  userId: string,
): Promise<boolean> {
  return hasAnyActiveMembershipFromDb(userId);
}

export async function storeUpsertPharmacyMembership(input: {
  pharmacyId: string;
  userId: string;
  role: string;
  isActive?: boolean;
}): Promise<void> {
  await upsertPharmacyMembershipFromDb(input);
}

export async function storeCountAllPharmacyMemberships(): Promise<number> {
  return countAllPharmacyMembershipsFromDb();
}

export async function storeCreatePharmacyMembership(input: {
  pharmacyId: string;
  userId: string;
  role: string;
  isActive?: boolean;
}): Promise<void> {
  await createPharmacyMembershipFromDb(input);
}
