import type { user_role } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type PharmacyMembershipRow = {
  pharmacy_id: string;
  role: string;
};

export type PharmacyMembershipWithName = PharmacyMembershipRow & {
  pharmacy_name: string | null;
};

export type PharmacyMembershipRecord = {
  id: string;
  pharmacy_id: string;
  user_id: string;
  role: string;
  is_active: boolean | null;
};

export async function countActivePharmacyUsersFromDb(
  pharmacyId: string,
): Promise<number> {
  return prisma.pharmacy_users.count({
    where: { pharmacy_id: pharmacyId, is_active: true },
  });
}

export async function listActiveMembershipsForUserFromDb(
  userId: string,
): Promise<PharmacyMembershipRow[]> {
  const rows = await prisma.pharmacy_users.findMany({
    where: { user_id: userId, is_active: true },
    select: { pharmacy_id: true, role: true },
  });

  return rows
    .filter((row) => row.pharmacy_id)
    .map((row) => ({
      pharmacy_id: row.pharmacy_id as string,
      role: row.role,
    }));
}

export async function listActiveMembershipsWithPharmacyNameFromDb(
  userId: string,
): Promise<PharmacyMembershipWithName[]> {
  const rows = await prisma.pharmacy_users.findMany({
    where: { user_id: userId, is_active: true },
    select: {
      pharmacy_id: true,
      role: true,
      pharmacies: { select: { name: true } },
    },
  });

  return rows
    .filter((row) => row.pharmacy_id)
    .map((row) => ({
      pharmacy_id: row.pharmacy_id as string,
      role: row.role,
      pharmacy_name: row.pharmacies?.name ?? null,
    }));
}

export async function findFirstActiveMembershipFromDb(
  userId: string,
  options?: { roles?: string[] },
): Promise<PharmacyMembershipRow | null> {
  const row = await prisma.pharmacy_users.findFirst({
    where: {
      user_id: userId,
      is_active: true,
      ...(options?.roles?.length
        ? { role: { in: options.roles as user_role[] } }
        : {}),
    },
    select: { pharmacy_id: true, role: true },
  });

  if (!row?.pharmacy_id) return null;
  return { pharmacy_id: row.pharmacy_id, role: row.role };
}

export async function findMembershipAtPharmacyFromDb(
  userId: string,
  pharmacyId: string,
): Promise<PharmacyMembershipRow | null> {
  const row = await prisma.pharmacy_users.findFirst({
    where: {
      user_id: userId,
      pharmacy_id: pharmacyId,
      is_active: true,
    },
    select: { pharmacy_id: true, role: true },
  });

  if (!row?.pharmacy_id) return null;
  return { pharmacy_id: row.pharmacy_id, role: row.role };
}

export async function findMembershipIdByUserAndPharmacyFromDb(
  userId: string,
  pharmacyId: string,
): Promise<string | null> {
  const row = await prisma.pharmacy_users.findFirst({
    where: {
      user_id: userId,
      pharmacy_id: pharmacyId,
      is_active: true,
    },
    select: { id: true },
  });
  return row?.id ?? null;
}

export async function hasAnyActiveMembershipFromDb(
  userId: string,
): Promise<boolean> {
  const count = await prisma.pharmacy_users.count({
    where: { user_id: userId, is_active: true },
  });
  return count > 0;
}

export async function upsertPharmacyMembershipFromDb(input: {
  pharmacyId: string;
  userId: string;
  role: string;
  isActive?: boolean;
}): Promise<void> {
  await prisma.pharmacy_users.upsert({
    where: {
      pharmacy_id_user_id: {
        pharmacy_id: input.pharmacyId,
        user_id: input.userId,
      },
    },
    create: {
      pharmacy_id: input.pharmacyId,
      user_id: input.userId,
      role: input.role as user_role,
      is_active: input.isActive ?? true,
    },
    update: {
      role: input.role as user_role,
      is_active: input.isActive ?? true,
      updated_at: new Date(),
    },
  });
}

export async function countAllPharmacyMembershipsFromDb(): Promise<number> {
  return prisma.pharmacy_users.count();
}

export async function createPharmacyMembershipFromDb(input: {
  pharmacyId: string;
  userId: string;
  role: string;
  isActive?: boolean;
}): Promise<void> {
  await prisma.pharmacy_users.create({
    data: {
      pharmacy_id: input.pharmacyId,
      user_id: input.userId,
      role: input.role as user_role,
      is_active: input.isActive ?? true,
    },
  });
}
