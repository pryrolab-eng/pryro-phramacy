import {
  createAuthUserFromDb,
  deleteAuthUserFromDb,
  findAuthUserByIdFromDb,
  updateAuthUserMetadataFromDb,
  updateAuthUserPasswordFromDb,
} from "@/lib/db/auth-credentials";
import { storeUpsertPublicUser } from "@/lib/db/public-users-store";

export async function adminCreateAuthUser(input: {
  email: string;
  password: string;
  fullName?: string;
  emailConfirmed?: boolean;
  userMetadata?: Record<string, unknown>;
}): Promise<{ user: { id: string; email: string } }> {
  const created = await createAuthUserFromDb({
    email: input.email,
    password: input.password,
    fullName: input.fullName,
    emailConfirmed: input.emailConfirmed,
    userMetadata: input.userMetadata,
  });

  await storeUpsertPublicUser({
    userId: created.id,
    email: input.email,
    name: input.fullName,
    fullName: input.fullName,
  });

  return { user: { id: created.id, email: input.email } };
}

export async function adminUpdateAuthUserPassword(
  userId: string,
  password: string,
): Promise<void> {
  await updateAuthUserPasswordFromDb(userId, password);
}

export async function adminUpdateAuthUserEmail(
  userId: string,
  email: string,
): Promise<void> {
  const { prisma } = await import("@/lib/db/prisma");
  await prisma.auth_users.update({
    where: { id: userId },
    data: { email: email.trim().toLowerCase(), updated_at: new Date() },
  });
  await storeUpsertPublicUser({ userId, email });
}

export async function adminGetAuthUserById(userId: string): Promise<{
  id: string;
  email: string | null;
  user_metadata: Record<string, unknown>;
} | null> {
  const row = await findAuthUserByIdFromDb(userId);
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    user_metadata: row.raw_user_meta_data ?? {},
  };
}

export async function adminUpdateAuthUserMetadata(
  userId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  await updateAuthUserMetadataFromDb(userId, metadata);
}

export async function adminDeleteAuthUser(userId: string): Promise<void> {
  await deleteAuthUserFromDb(userId);
}
