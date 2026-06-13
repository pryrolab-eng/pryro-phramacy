import type { user_role } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type PharmacyStaffRow = {
  id: string;
  user_id: string | null;
  role: string;
  is_active: boolean | null;
  created_at: string | null;
  pharmacy_id: string | null;
};

export type FormattedStaffMember = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: string;
  status: "active" | "inactive";
  joinDate: string;
};

function mapPharmacyStaffRow(row: {
  id: string;
  user_id: string | null;
  role: user_role;
  is_active: boolean | null;
  created_at: Date | null;
  pharmacy_id: string | null;
}): PharmacyStaffRow {
  return {
    id: row.id,
    user_id: row.user_id,
    role: row.role,
    is_active: row.is_active,
    created_at: row.created_at?.toISOString() ?? null,
    pharmacy_id: row.pharmacy_id,
  };
}

export async function listPharmacyStaffFromDb(
  pharmacyId: string,
): Promise<FormattedStaffMember[]> {
  const rows = await prisma.pharmacy_users.findMany({
    where: { pharmacy_id: pharmacyId },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      user_id: true,
      role: true,
      is_active: true,
      created_at: true,
    },
  });

  const userIds = rows
    .map((row) => row.user_id)
    .filter((id): id is string => Boolean(id));

  const profiles =
    userIds.length > 0
      ? await prisma.public_users.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            name: true,
            full_name: true,
            email: true,
          },
        })
      : [];

  const profileById = new Map(profiles.map((p) => [p.id, p]));

  return rows
    .filter((row) => row.user_id)
    .map((row) => {
      const profile = profileById.get(row.user_id as string);
      const email = profile?.email ?? null;
      const name =
        profile?.full_name ||
        profile?.name ||
        (email ? email.split("@")[0] : "Unknown");

      return {
        id: row.id,
        name,
        email,
        phone: "N/A",
        role: row.role,
        status: row.is_active ? "active" : "inactive",
        joinDate: row.created_at
          ? new Date(row.created_at).toLocaleDateString()
          : "",
      };
    });
}

export async function findPharmacyUserByIdFromDb(
  pharmacyUserId: string,
): Promise<PharmacyStaffRow | null> {
  const row = await prisma.pharmacy_users.findUnique({
    where: { id: pharmacyUserId },
  });
  return row ? mapPharmacyStaffRow(row) : null;
}

export async function updatePharmacyUserFromDb(input: {
  pharmacyUserId: string;
  role?: string;
  isActive?: boolean;
}): Promise<void> {
  await prisma.pharmacy_users.update({
    where: { id: input.pharmacyUserId },
    data: {
      ...(input.role !== undefined ? { role: input.role as user_role } : {}),
      ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
      updated_at: new Date(),
    },
  });
}

export async function deletePharmacyUserFromDb(
  pharmacyUserId: string,
): Promise<void> {
  await prisma.pharmacy_users.delete({ where: { id: pharmacyUserId } });
}

export { updatePublicUserProfileFromDb } from "@/lib/db/public-users";

export async function getStaffBranchIdsFromDb(
  pharmacyUserId: string,
): Promise<string[]> {
  const rows = await prisma.staff_branch_assignments.findMany({
    where: { pharmacy_user_id: pharmacyUserId },
    select: { branch_id: true },
  });
  return rows.map((row) => row.branch_id);
}

export async function setStaffBranchAssignmentsFromDb(input: {
  pharmacyUserId: string;
  branchIds: string[];
}): Promise<void> {
  await prisma.$transaction([
    prisma.staff_branch_assignments.deleteMany({
      where: { pharmacy_user_id: input.pharmacyUserId },
    }),
    ...(input.branchIds.length > 0
      ? [
          prisma.staff_branch_assignments.createMany({
            data: input.branchIds.map((branch_id) => ({
              pharmacy_user_id: input.pharmacyUserId,
              branch_id,
            })),
          }),
        ]
      : []),
  ]);
}

export async function countPharmacyBranchesByIds(input: {
  pharmacyId: string;
  branchIds: string[];
}): Promise<number> {
  return prisma.branches.count({
    where: {
      pharmacy_id: input.pharmacyId,
      id: { in: input.branchIds },
    },
  });
}
