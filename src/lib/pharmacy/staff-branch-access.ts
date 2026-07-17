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

/**
 * Pick a branch the staff member may use.
 * Prefers `preferredBranchId` when allowed; otherwise HQ (if allowed), else oldest allowed.
 */
export async function pickStaffScopedBranchId(
  pharmacyId: string,
  allowedBranchIds: string[] | null,
  preferredBranchId: string | null,
): Promise<string | null> {
  if (allowedBranchIds !== null && allowedBranchIds.length === 0) {
    return null;
  }

  const branches = await prisma.branches.findMany({
    where: {
      pharmacy_id: pharmacyId,
      is_active: { not: false },
      ...(allowedBranchIds !== null
        ? { id: { in: allowedBranchIds } }
        : {}),
    },
    orderBy: [{ is_headquarters: "desc" }, { created_at: "asc" }],
    select: { id: true, is_headquarters: true },
  });

  if (branches.length === 0) return null;

  if (
    preferredBranchId &&
    branches.some((b) => b.id === preferredBranchId)
  ) {
    return preferredBranchId;
  }

  const hq = branches.find((b) => b.is_headquarters);
  return hq?.id ?? branches[0]?.id ?? null;
}

/**
 * Resolve which branch filter to apply for reads/writes.
 * - Requested id: must belong to pharmacy + be allowed
 * - Unset ("all"): unrestricted → null (whole pharmacy);
 *   restricted staff → pinned to their active/allowed branch (never other outlets)
 */
export async function resolveDataBranchScope(
  userId: string,
  pharmacyId: string,
  role: string | null,
  requestedBranchId: string | null | undefined,
  activeBranchId: string | null,
): Promise<{ branchId: string | null; allowedBranchIds: string[] | null }> {
  const allowedBranchIds = await getStaffAllowedBranchIds(
    userId,
    pharmacyId,
    role,
  );

  if (requestedBranchId) {
    const branch = await prisma.branches.findFirst({
      where: {
        id: requestedBranchId,
        pharmacy_id: pharmacyId,
        is_active: { not: false },
      },
      select: { id: true },
    });
    if (!branch) {
      throw new Error("Invalid branch for the active pharmacy");
    }
    if (
      allowedBranchIds !== null &&
      !allowedBranchIds.includes(requestedBranchId)
    ) {
      throw new Error("You do not have access to this branch");
    }
    return { branchId: requestedBranchId, allowedBranchIds };
  }

  // "All branches" — only for unrestricted users
  if (allowedBranchIds === null) {
    return { branchId: null, allowedBranchIds };
  }

  const pinned = await pickStaffScopedBranchId(
    pharmacyId,
    allowedBranchIds,
    activeBranchId,
  );
  if (!pinned) {
    throw new Error("No active branch. Ask an owner to assign you a location.");
  }
  return { branchId: pinned, allowedBranchIds };
}
