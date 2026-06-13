import { prisma } from "@/lib/db/prisma";
import { REFRESH_SESSION_TTL_MS } from "@/lib/auth/native/session-token";

export function defaultSessionExpiry(): Date {
  return new Date(Date.now() + REFRESH_SESSION_TTL_MS);
}

export async function createAppSessionFromDb(input: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string | null;
  ip?: string | null;
}) {
  return prisma.app_sessions.create({
    data: {
      user_id: input.userId,
      token_hash: input.tokenHash,
      expires_at: input.expiresAt,
      user_agent: input.userAgent ?? null,
      ip: input.ip ?? null,
    },
    select: { id: true },
  });
}

export async function findValidAppSessionFromDb(
  sessionId: string,
): Promise<{ user_id: string } | null> {
  const row = await prisma.app_sessions.findFirst({
    where: {
      id: sessionId,
      expires_at: { gt: new Date() },
    },
    select: { user_id: true },
  });
  return row;
}

export async function deleteAppSessionFromDb(sessionId: string): Promise<void> {
  await prisma.app_sessions.deleteMany({ where: { id: sessionId } });
}

export async function deleteAppSessionsForUserFromDb(
  userId: string,
): Promise<void> {
  await prisma.app_sessions.deleteMany({ where: { user_id: userId } });
}

export async function purgeExpiredAppSessionsFromDb(): Promise<void> {
  await prisma.app_sessions.deleteMany({
    where: { expires_at: { lt: new Date() } },
  });
}
