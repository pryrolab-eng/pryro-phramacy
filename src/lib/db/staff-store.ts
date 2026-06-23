import {
  countPharmacyBranchesByIds,
  deletePharmacyUserFromDb,
  findPharmacyUserByIdFromDb,
  getStaffBranchIdsFromDb,
  listPharmacyStaffFromDb,
  setStaffBranchAssignmentsFromDb,
  updatePharmacyUserFromDb,
  type FormattedStaffMember,
  type PharmacyStaffRow,
} from "@/lib/db/staff";
import { storeUpdatePublicUserProfile } from "@/lib/db/public-users-store";

export type { FormattedStaffMember, PharmacyStaffRow };

export async function storeListPharmacyStaff(
  pharmacyId: string,
): Promise<FormattedStaffMember[]> {
  return listPharmacyStaffFromDb(pharmacyId);
}

export async function storeFindPharmacyUser(
  pharmacyUserId: string,
): Promise<PharmacyStaffRow | null> {
  return findPharmacyUserByIdFromDb(pharmacyUserId);
}

export async function storeUpdateStaffMember(input: {
  pharmacyUserId: string;
  authUserId: string;
  name?: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
}): Promise<void> {
  if (input.name !== undefined || input.phone !== undefined) {
    await storeUpdatePublicUserProfile({
      userId: input.authUserId,
      name: input.name,
      phone: input.phone,
    });
  }
  if (input.role !== undefined || input.isActive !== undefined) {
    await updatePharmacyUserFromDb({
      pharmacyUserId: input.pharmacyUserId,
      role: input.role,
      isActive: input.isActive,
    });
  }
}

export async function storeDeletePharmacyUser(
  pharmacyUserId: string,
): Promise<void> {
  await deletePharmacyUserFromDb(pharmacyUserId);
}

export async function storeGetStaffBranchIds(
  pharmacyUserId: string,
): Promise<string[]> {
  return getStaffBranchIdsFromDb(pharmacyUserId);
}

export async function storeSetStaffBranchAssignments(input: {
  pharmacyUserId: string;
  branchIds: string[];
}): Promise<void> {
  await setStaffBranchAssignmentsFromDb(input);
}

export async function storeValidateBranchIds(input: {
  pharmacyId: string;
  branchIds: string[];
}): Promise<boolean> {
  if (input.branchIds.length === 0) return true;
  const count = await countPharmacyBranchesByIds(input);
  return count === input.branchIds.length;
}
