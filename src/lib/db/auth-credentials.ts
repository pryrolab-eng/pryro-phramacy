import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/native/password";

export type AuthCredentialUser = {
  id: string;
  email: string | null;
  encrypted_password: string | null;
  raw_user_meta_data: Record<string, unknown> | null;
  email_confirmed_at: Date | null;
};

export async function findAuthUserByEmailFromDb(
  email: string,
): Promise<AuthCredentialUser | null> {
  const row = await prisma.auth_users.findFirst({
    where: { email: { equals: email.trim(), mode: "insensitive" } },
    select: {
      id: true,
      email: true,
      encrypted_password: true,
      raw_user_meta_data: true,
      email_confirmed_at: true,
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    encrypted_password: row.encrypted_password,
    raw_user_meta_data: (row.raw_user_meta_data as Record<string, unknown>) ?? null,
    email_confirmed_at: row.email_confirmed_at,
  };
}

export async function findAuthUserByIdFromDb(
  userId: string,
): Promise<AuthCredentialUser | null> {
  const row = await prisma.auth_users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      encrypted_password: true,
      raw_user_meta_data: true,
      email_confirmed_at: true,
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    encrypted_password: row.encrypted_password,
    raw_user_meta_data: (row.raw_user_meta_data as Record<string, unknown>) ?? null,
    email_confirmed_at: row.email_confirmed_at,
  };
}

export async function createAuthUserFromDb(input: {
  email: string;
  password: string;
  fullName?: string;
  emailConfirmed?: boolean;
  userMetadata?: Record<string, unknown>;
}): Promise<{ id: string }> {
  const passwordHash = await hashPassword(input.password);
  const now = new Date();
  const id = crypto.randomUUID();
  const meta: Record<string, unknown> = {
    ...(input.userMetadata ?? {}),
    ...(input.fullName
      ? { full_name: input.fullName, name: input.fullName }
      : {}),
  };

  await prisma.auth_users.create({
    data: {
      id,
      aud: "authenticated",
      role: "authenticated",
      email: input.email.trim().toLowerCase(),
      encrypted_password: passwordHash,
      email_confirmed_at: input.emailConfirmed !== false ? now : null,
      raw_user_meta_data: meta as Prisma.InputJsonValue,
      created_at: now,
      updated_at: now,
    },
  });

  return { id };
}

export async function confirmAuthUserEmailFromDb(userId: string): Promise<void> {
  await prisma.auth_users.update({
    where: { id: userId },
    data: {
      email_confirmed_at: new Date(),
      updated_at: new Date(),
    },
  });
}

export async function updateAuthUserPasswordFromDb(
  userId: string,
  password: string,
): Promise<void> {
  const passwordHash = await hashPassword(password);
  await prisma.auth_users.update({
    where: { id: userId },
    data: {
      encrypted_password: passwordHash,
      updated_at: new Date(),
    },
  });
}

export async function touchAuthUserLastSignInFromDb(
  userId: string,
): Promise<void> {
  await prisma.auth_users.update({
    where: { id: userId },
    data: { last_sign_in_at: new Date(), updated_at: new Date() },
  });
}

export async function updateAuthUserMetadataFromDb(
  userId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const existing = await prisma.auth_users.findUnique({
    where: { id: userId },
    select: { raw_user_meta_data: true },
  });
  const merged = {
    ...((existing?.raw_user_meta_data as Record<string, unknown>) ?? {}),
    ...patch,
  };
  await prisma.auth_users.update({
    where: { id: userId },
    data: {
      raw_user_meta_data: merged as Prisma.InputJsonValue,
      updated_at: new Date(),
    },
  });

  const { invalidateNativeAuthUserCache } = await import(
    "@/lib/auth/native/session-cache"
  );
  invalidateNativeAuthUserCache(userId);
}

export async function deleteAuthUserFromDb(userId: string): Promise<void> {
  await prisma.auth_users.delete({ where: { id: userId } });
}
