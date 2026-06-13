import {
  createTwoFactorSessionFromDb,
  findPendingTwoFactorSessionFromDb,
  findVerifiedTwoFactorSessionFromDb,
  markTwoFactorSessionVerifiedFromDb,
  type TwoFactorSessionRow,
} from "@/lib/db/two-factor-sessions";

export type { TwoFactorSessionRow };

export async function storeCreateTwoFactorSession(input: {
  userId: string;
  sessionToken: string;
  expiresAt: Date;
}): Promise<void> {
  await createTwoFactorSessionFromDb(input);
}

export async function storeFindPendingTwoFactorSession(
  sessionToken: string,
): Promise<TwoFactorSessionRow | null> {
  return findPendingTwoFactorSessionFromDb(sessionToken);
}

export async function storeMarkTwoFactorSessionVerified(
  sessionToken: string,
): Promise<void> {
  await markTwoFactorSessionVerifiedFromDb(sessionToken);
}

export async function storeFindVerifiedTwoFactorSession(
  sessionToken: string,
): Promise<{ user_id: string; verified: boolean | null } | null> {
  return findVerifiedTwoFactorSessionFromDb(sessionToken);
}
