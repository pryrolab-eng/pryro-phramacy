import { prisma } from "@/lib/db/prisma";
import { storeFindMembershipIdByUserAndPharmacy } from "@/lib/db/pharmacy-users-store";

const UNRESTRICTED_ROLES = new Set(["pharmacy_owner", "admin"]);

/**
 * Branch IDs the user may switch to for this pharmacy.
 * `null` = all active branches allowed.
 * `[]` = no branch access.
 */
export async function getStaffAllowedBranchIds(
  userId: string,
  pharmacyId: string,
  role: string | null,
): Promise<string[] | null> {
  if (role && UNRESTRICTED_ROLES.has(role)) {
    return null;
  }

  const membershipId = await storeFindMembershipIdByUserAndPharmacy(
    userId,
    pharmacyId,
  );
  if (!membershipId) return [];

  const assignments = await prisma.staff_branch_assignments.findMany({
    where: { pharmacy_user_id: membershipId },
    select: { branch_id: true },
  });

  if (!assignments.length) return null;

  return assignments.map((row) => row.branch_id);
}

export async function assertBranchAllowedForUser(
  userId: string,
  pharmacyId: string,
  role: string | null,
  branchId: string,
): Promise<void> {
  const allowed = await getStaffAllowedBranchIds(userId, pharmacyId, role);
  if (allowed === null) return;
  if (!allowed.includes(branchId)) {
    throw new Error("You do not have access to this branch");
  }
}
