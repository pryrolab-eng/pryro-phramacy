import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { touchAuthUserLastSignInFromDb } from "@/lib/db/auth-credentials";
import { storeUpsertPublicUser } from "@/lib/db/public-users-store";
import type { GoogleUserProfile } from "@/lib/auth/native/google-oauth";

function buildIdentityData(profile: GoogleUserProfile): Prisma.InputJsonValue {
  return {
    sub: profile.sub,
    email: profile.email,
    email_verified: profile.emailVerified,
    name: profile.name,
    picture: profile.picture,
    iss: "https://accounts.google.com",
    provider: "google",
  };
}

function buildUserMetadata(profile: GoogleUserProfile): Prisma.InputJsonValue {
  return {
    full_name: profile.name,
    name: profile.name,
    avatar_url: profile.picture,
    email_verified: profile.emailVerified,
    provider: "google",
  };
}

/**
 * Sign in or register via Google — links identity row + auth.users + public.users.
 */
export async function findOrCreateGoogleAuthUser(
  profile: GoogleUserProfile,
): Promise<string> {
  const now = new Date();

  const existingIdentity = await prisma.identities.findUnique({
    where: {
      provider_id_provider: {
        provider_id: profile.sub,
        provider: "google",
      },
    },
    select: { user_id: true },
  });

  if (existingIdentity?.user_id) {
    await prisma.identities.update({
      where: {
        provider_id_provider: {
          provider_id: profile.sub,
          provider: "google",
        },
      },
      data: {
        identity_data: buildIdentityData(profile),
        email: profile.email,
        last_sign_in_at: now,
        updated_at: now,
      },
    });
    await touchAuthUserLastSignInFromDb(existingIdentity.user_id);
    await storeUpsertPublicUser({
      userId: existingIdentity.user_id,
      email: profile.email,
      name: profile.name ?? undefined,
      fullName: profile.name ?? undefined,
    });
    return existingIdentity.user_id;
  }

  const existingUser = await prisma.auth_users.findFirst({
    where: { email: { equals: profile.email, mode: "insensitive" } },
    select: { id: true, raw_user_meta_data: true },
  });

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
    const priorMeta =
      (existingUser.raw_user_meta_data as Record<string, unknown>) ?? {};
    await prisma.auth_users.update({
      where: { id: userId },
      data: {
        email_confirmed_at: now,
        is_sso_user: true,
        last_sign_in_at: now,
        raw_user_meta_data: {
          ...priorMeta,
          ...(buildUserMetadata(profile) as Record<string, unknown>),
        } as Prisma.InputJsonValue,
        updated_at: now,
      },
    });
  } else {
    userId = crypto.randomUUID();
    await prisma.auth_users.create({
      data: {
        id: userId,
        aud: "authenticated",
        role: "authenticated",
        email: profile.email,
        email_confirmed_at: now,
        is_sso_user: true,
        last_sign_in_at: now,
        raw_user_meta_data: buildUserMetadata(profile),
        raw_app_meta_data: { provider: "google" },
        created_at: now,
        updated_at: now,
      },
    });
  }

  await prisma.identities.create({
    data: {
      provider_id: profile.sub,
      user_id: userId,
      provider: "google",
      identity_data: buildIdentityData(profile),
      email: profile.email,
      last_sign_in_at: now,
      created_at: now,
      updated_at: now,
    },
  });

  await storeUpsertPublicUser({
    userId,
    email: profile.email,
    name: profile.name ?? undefined,
    fullName: profile.name ?? undefined,
  });

  return userId;
}
