import {
  disableTwoFactorFromDb,
  enableTwoFactorFromDb,
  findPublicUserByIdFromDb,
  getIsPlatformAdminFromDb,
  getPublicUserProfileFromDb,
  getTwoFactorAuthDataFromDb,
  getTwoFactorEnabledFromDb,
  getTwoFactorSecretFromDb,
  getUserActiveContextFromDb,
  saveTwoFactorSetupFromDb,
  countPublicUsersFromDb,
  findPublicUserIdByEmailFromDb,
  updatePublicUserProfileFromDb,
  updateTwoFactorBackupCodesFromDb,
  updateUserActiveContextFromDb,
  upsertPublicUserFromDb,
  type PublicUserActiveContext,
  type PublicUserProfile,
} from "@/lib/db/public-users";

export type { PublicUserActiveContext, PublicUserProfile };

export async function storeFindPublicUserById(userId: string) {
  return findPublicUserByIdFromDb(userId);
}

export async function storeGetPublicUserProfile(
  userId: string,
): Promise<PublicUserProfile | null> {
  return getPublicUserProfileFromDb(userId);
}

export async function storeGetIsPlatformAdmin(userId: string): Promise<boolean> {
  return getIsPlatformAdminFromDb(userId);
}

export async function storeGetUserActiveContext(
  userId: string,
): Promise<PublicUserActiveContext | null> {
  return getUserActiveContextFromDb(userId);
}

export async function storeUpdateUserActiveContext(
  userId: string,
  pharmacyId: string | null,
  branchId: string | null,
): Promise<void> {
  await updateUserActiveContextFromDb(userId, pharmacyId, branchId);
}

export async function storeUpsertPublicUser(input: {
  userId: string;
  email: string;
  name?: string;
  fullName?: string;
}): Promise<void> {
  await upsertPublicUserFromDb(input);
}

export async function storeGetTwoFactorSecret(
  userId: string,
): Promise<string | null> {
  return getTwoFactorSecretFromDb(userId);
}

export async function storeSaveTwoFactorSetup(
  userId: string,
  secret: string,
  backupCodes: string[],
): Promise<void> {
  await saveTwoFactorSetupFromDb(userId, secret, backupCodes);
}

export async function storeEnableTwoFactor(userId: string): Promise<void> {
  await enableTwoFactorFromDb(userId);
}

export async function storeDisableTwoFactor(userId: string): Promise<void> {
  await disableTwoFactorFromDb(userId);
}

export async function storeGetTwoFactorAuthData(userId: string) {
  return getTwoFactorAuthDataFromDb(userId);
}

export async function storeUpdateTwoFactorBackupCodes(
  userId: string,
  backupCodes: string[],
): Promise<void> {
  await updateTwoFactorBackupCodesFromDb(userId, backupCodes);
}

export async function storeUpdatePublicUserProfile(input: {
  userId: string;
  name?: string;
  phone?: string;
}): Promise<void> {
  await updatePublicUserProfileFromDb(input);
}

export async function storeFindPublicUserIdByEmail(
  email: string,
): Promise<string | null> {
  return findPublicUserIdByEmailFromDb(email);
}

export async function storeCountPublicUsers(): Promise<number> {
  return countPublicUsersFromDb();
}

export async function storeGetTwoFactorEnabled(userId: string): Promise<boolean> {
  return getTwoFactorEnabledFromDb(userId);
}
