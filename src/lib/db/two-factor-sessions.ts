import { prisma } from "@/lib/db/prisma";

export type TwoFactorSessionRow = {
  user_id: string;
  expires_at: string;
  verified: boolean | null;
};

export async function createTwoFactorSessionFromDb(input: {
  userId: string;
  sessionToken: string;
  expiresAt: Date;
}): Promise<void> {
  await prisma.two_factor_sessions.create({
    data: {
      user_id: input.userId,
      session_token: input.sessionToken,
      verified: false,
      expires_at: input.expiresAt,
    },
  });
}

export async function findPendingTwoFactorSessionFromDb(
  sessionToken: string,
): Promise<TwoFactorSessionRow | null> {
  const row = await prisma.two_factor_sessions.findFirst({
    where: {
      session_token: sessionToken,
      verified: false,
    },
    select: { user_id: true, expires_at: true, verified: true },
  });
  if (!row) return null;
  return {
    user_id: row.user_id,
    expires_at: row.expires_at.toISOString(),
    verified: row.verified,
  };
}

export async function markTwoFactorSessionVerifiedFromDb(
  sessionToken: string,
): Promise<void> {
  await prisma.two_factor_sessions.updateMany({
    where: { session_token: sessionToken },
    data: { verified: true },
  });
}

export async function findVerifiedTwoFactorSessionFromDb(
  sessionToken: string,
): Promise<{ user_id: string; verified: boolean | null } | null> {
  const row = await prisma.two_factor_sessions.findFirst({
    where: {
      session_token: sessionToken,
      verified: true,
    },
    select: { user_id: true, verified: true },
  });
  return row;
}
