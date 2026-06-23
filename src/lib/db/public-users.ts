import { prisma } from "@/lib/db/prisma";

export type PublicUserProfile = {
  email: string | null;
  name: string | null;
  full_name: string | null;
  is_platform_admin: boolean;
};

export type PublicUserActiveContext = {
  active_pharmacy_id: string | null;
  active_branch_id: string | null;
};

export async function findPublicUserByIdFromDb(userId: string) {
  return prisma.public_users.findUnique({
    where: { id: userId },
    select: { email: true, name: true, full_name: true },
  });
}

export async function getPublicUserProfileFromDb(
  userId: string,
): Promise<PublicUserProfile | null> {
  const row = await prisma.public_users.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      full_name: true,
      is_platform_admin: true,
    },
  });
  if (!row) return null;
  return {
    email: row.email,
    name: row.name,
    full_name: row.full_name,
    is_platform_admin: row.is_platform_admin,
  };
}

export async function getIsPlatformAdminFromDb(userId: string): Promise<boolean> {
  const row = await prisma.public_users.findUnique({
    where: { id: userId },
    select: { is_platform_admin: true },
  });
  return row?.is_platform_admin === true;
}

export async function getUserActiveContextFromDb(
  userId: string,
): Promise<PublicUserActiveContext | null> {
  const row = await prisma.public_users.findUnique({
    where: { id: userId },
    select: { active_pharmacy_id: true, active_branch_id: true },
  });
  if (!row) return null;
  return {
    active_pharmacy_id: row.active_pharmacy_id,
    active_branch_id: row.active_branch_id,
  };
}

export async function updateUserActiveContextFromDb(
  userId: string,
  pharmacyId: string | null,
  branchId: string | null,
): Promise<void> {
  await prisma.public_users.update({
    where: { id: userId },
    data: {
      active_pharmacy_id: pharmacyId,
      active_branch_id: branchId,
      updated_at: new Date(),
    },
  });
}

export async function upsertPublicUserFromDb(input: {
  userId: string;
  email: string;
  name?: string;
  fullName?: string;
}): Promise<void> {
  const name = input.name ?? input.fullName ?? "";
  const fullName = input.fullName ?? input.name ?? name;
  await prisma.public_users.upsert({
    where: { id: input.userId },
    create: {
      id: input.userId,
      email: input.email,
      name,
      full_name: fullName,
      user_id: input.userId,
      token_identifier: input.email,
    },
    update: {
      email: input.email,
      ...(name ? { name, full_name: fullName } : {}),
      updated_at: new Date(),
    },
  });
}

export async function getTwoFactorSecretFromDb(
  userId: string,
): Promise<string | null> {
  const row = await prisma.public_users.findUnique({
    where: { id: userId },
    select: { two_factor_secret: true },
  });
  return row?.two_factor_secret ?? null;
}

export async function saveTwoFactorSetupFromDb(
  userId: string,
  secret: string,
  backupCodes: string[],
): Promise<void> {
  await prisma.public_users.update({
    where: { id: userId },
    data: {
      two_factor_secret: secret,
      two_factor_backup_codes: backupCodes,
      updated_at: new Date(),
    },
  });
}

export async function enableTwoFactorFromDb(userId: string): Promise<void> {
  await prisma.public_users.update({
    where: { id: userId },
    data: { two_factor_enabled: true, updated_at: new Date() },
  });
}

export async function disableTwoFactorFromDb(userId: string): Promise<void> {
  await prisma.public_users.update({
    where: { id: userId },
    data: {
      two_factor_enabled: false,
      two_factor_secret: null,
      two_factor_backup_codes: [],
      updated_at: new Date(),
    },
  });
}

export async function getTwoFactorEnabledFromDb(
  userId: string,
): Promise<boolean> {
  const row = await prisma.public_users.findUnique({
    where: { id: userId },
    select: { two_factor_enabled: true },
  });
  return row?.two_factor_enabled === true;
}

export async function getTwoFactorAuthDataFromDb(userId: string) {
  const row = await prisma.public_users.findUnique({
    where: { id: userId },
    select: { two_factor_secret: true, two_factor_backup_codes: true },
  });
  if (!row) return null;
  return {
    two_factor_secret: row.two_factor_secret,
    two_factor_backup_codes: row.two_factor_backup_codes ?? [],
  };
}

export async function updateTwoFactorBackupCodesFromDb(
  userId: string,
  backupCodes: string[],
): Promise<void> {
  await prisma.public_users.update({
    where: { id: userId },
    data: {
      two_factor_backup_codes: backupCodes,
      updated_at: new Date(),
    },
  });
}

export async function updatePublicUserProfileFromDb(input: {
  userId: string;
  name?: string;
  phone?: string;
}): Promise<void> {
  await prisma.public_users.update({
    where: { id: input.userId },
    data: {
      ...(input.name !== undefined
        ? { name: input.name, full_name: input.name }
        : {}),
      updated_at: new Date(),
    },
  });
}

export async function findPublicUserIdByEmailFromDb(
  email: string,
): Promise<string | null> {
  const row = await prisma.public_users.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  return row?.id ?? null;
}

export async function countPublicUsersFromDb(): Promise<number> {
  return prisma.public_users.count();
}
