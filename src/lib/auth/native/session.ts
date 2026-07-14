import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import {
  REFRESH_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/auth-mode";
import {
  createAppSessionFromDb,
  defaultSessionExpiry,
  deleteAppSessionFromDb,
  findValidAppSessionFromDb,
} from "@/lib/db/app-sessions";
import {
  clearNativeSessionCookieOnResponse,
  setNativeSessionCookieOnResponse,
} from "@/lib/auth/native/session-cookie";
import {
  ACCESS_SESSION_TTL_MS,
  signRefreshJwt,
  signSessionJwt,
  verifyRefreshJwt,
  verifySessionJwt,
} from "@/lib/auth/native/session-jwt";
import {
  generateSessionToken,
  hashSessionToken,
} from "@/lib/auth/native/session-token";
import { isPrismaUnreachableError } from "@/lib/db/prisma-errors";
import { touchAuthUserLastSignInFromDb } from "@/lib/db/auth-credentials";
import type { AuthUser } from "@/lib/auth/types";
import { findAuthUserByIdFromDb } from "@/lib/db/auth-credentials";
import {
  cacheNativeAuthUser,
  cacheNativeSessionValid,
  getCachedNativeAuthUser,
  getCachedNativeSessionValid,
  invalidateNativeAuthUserCache,
  isNativeSessionRevoked,
  markNativeSessionRevoked,
} from "@/lib/auth/native/session-cache";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export type NativeSessionTokens = {
  accessJwt: string;
  refreshJwt: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
};

export async function createNativeSession(
  userId: string,
  options?: { userAgent?: string | null; ip?: string | null },
): Promise<NativeSessionTokens> {
  const rawToken = generateSessionToken();
  const refreshExpiresAt = defaultSessionExpiry();
  const accessExpiresAt = new Date(Date.now() + ACCESS_SESSION_TTL_MS);

  const row = await createAppSessionFromDb({
    userId,
    tokenHash: hashSessionToken(rawToken),
    expiresAt: refreshExpiresAt,
    userAgent: options?.userAgent,
    ip: options?.ip,
  });

  await touchAuthUserLastSignInFromDb(userId);

  const payload = { sub: userId, sid: row.id };
  const [accessJwt, refreshJwt] = await Promise.all([
    signSessionJwt(payload, accessExpiresAt),
    signRefreshJwt(payload, refreshExpiresAt),
  ]);

  return { accessJwt, refreshJwt, accessExpiresAt, refreshExpiresAt };
}

export async function setNativeSessionCookies(tokens: NativeSessionTokens) {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, tokens.accessJwt, {
    ...COOKIE_OPTIONS,
    expires: tokens.accessExpiresAt,
  });
  store.set(REFRESH_COOKIE_NAME, tokens.refreshJwt, {
    ...COOKIE_OPTIONS,
    expires: tokens.refreshExpiresAt,
  });
}

export async function setNativeSessionCookie(jwt: string, expiresAt: Date) {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, jwt, {
    ...COOKIE_OPTIONS,
    expires: expiresAt,
  });
}

export { setNativeSessionCookieOnResponse } from "@/lib/auth/native/session-cookie";

export async function clearNativeSessionCookie() {
  const store = await cookies();
  const accessJwt = store.get(SESSION_COOKIE_NAME)?.value;
  const refreshJwt = store.get(REFRESH_COOKIE_NAME)?.value;

  // Clear cookies first so logout feels instant; revoke DB row after.
  store.set(SESSION_COOKIE_NAME, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  store.set(REFRESH_COOKIE_NAME, "", { ...COOKIE_OPTIONS, maxAge: 0 });

  const accessPayload = accessJwt ? await verifySessionJwt(accessJwt) : null;
  const refreshPayload =
    refreshJwt && !accessPayload ? await verifyRefreshJwt(refreshJwt) : null;
  const payload = accessPayload ?? refreshPayload;

  if (payload) {
    markNativeSessionRevoked(payload.sid);
    invalidateNativeAuthUserCache(payload.sub);
    void deleteAppSessionFromDb(payload.sid).catch(() => {});
  }
}

export { clearNativeSessionCookieOnResponse } from "@/lib/auth/native/session-cookie";

export function getNativeSessionJwtFromRequest(
  request: NextRequest,
): string | null {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export function getNativeRefreshJwtFromRequest(
  request: NextRequest,
): string | null {
  return request.cookies.get(REFRESH_COOKIE_NAME)?.value ?? null;
}

async function assertRefreshSessionValid(
  payload: { sub: string; sid: string },
  options?: { trustJwtIfDbUnreachable?: boolean },
): Promise<boolean> {
  if (isNativeSessionRevoked(payload.sid)) return false;
  if (getCachedNativeSessionValid(payload.sid, payload.sub)) return true;
  try {
    const session = await findValidAppSessionFromDb(payload.sid);
    if (!session || session.user_id !== payload.sub) return false;
    cacheNativeSessionValid(payload.sid, payload.sub);
    return true;
  } catch (error) {
    if (options?.trustJwtIfDbUnreachable && isPrismaUnreachableError(error)) {
      return true;
    }
    throw error;
  }
}

async function loadAuthUserForPayload(
  payload: { sub: string; sid: string },
): Promise<AuthUser | null> {
  const cached = getCachedNativeAuthUser(payload.sub);
  if (cached) return cached;

  try {
    const authUser = await findAuthUserByIdFromDb(payload.sub);
    if (!authUser) return null;

    const user: AuthUser = {
      id: authUser.id,
      email: authUser.email,
      user_metadata: authUser.raw_user_meta_data ?? {},
    };
    cacheNativeAuthUser(user);
    return user;
  } catch (error) {
    if (isPrismaUnreachableError(error)) {
      return {
        id: payload.sub,
        email: null,
        user_metadata: {},
      };
    }
    throw error;
  }
}

/** Validate refresh token and return the user without mutating cookies (RSC-safe). */
export async function resolveNativeAuthUserFromRefreshToken(
  refreshJwt: string | null | undefined,
): Promise<AuthUser | null> {
  if (!refreshJwt) return null;
  const payload = await verifyRefreshJwt(refreshJwt);
  if (!payload) return null;
  if (
    !(await assertRefreshSessionValid(payload, {
      trustJwtIfDbUnreachable: true,
    }))
  ) {
    return null;
  }
  return loadAuthUserForPayload(payload);
}

/** Issue a new access cookie from a valid refresh token. */
export async function refreshNativeAccessFromRefreshToken(
  refreshJwt: string | null | undefined,
  options?: { response?: NextResponse; rotateRefresh?: boolean },
): Promise<boolean> {
  if (!refreshJwt) return false;
  const payload = await verifyRefreshJwt(refreshJwt);
  if (!payload) return false;
  if (!(await assertRefreshSessionValid(payload))) return false;

  const accessExpiresAt = new Date(Date.now() + ACCESS_SESSION_TTL_MS);
  const accessJwt = await signSessionJwt(payload, accessExpiresAt);

  if (options?.rotateRefresh) {
    // Refresh token rotation: create new session, invalidate old
    const rawToken = generateSessionToken();
    const refreshExpiresAt = defaultSessionExpiry();

    const newSession = await createAppSessionFromDb({
      userId: payload.sub,
      tokenHash: hashSessionToken(rawToken),
      expiresAt: refreshExpiresAt,
    });

    await deleteAppSessionFromDb(payload.sid);
    markNativeSessionRevoked(payload.sid);
    invalidateNativeAuthUserCache(payload.sub);

    const newPayload = { sub: payload.sub, sid: newSession.id };
    const [newAccessJwt, newRefreshJwt] = await Promise.all([
      signSessionJwt(newPayload, accessExpiresAt),
      signRefreshJwt(newPayload, refreshExpiresAt),
    ]);

    if (options?.response) {
      setNativeSessionCookieOnResponse(options.response, newAccessJwt, accessExpiresAt);
      options.response.cookies.set(REFRESH_COOKIE_NAME, newRefreshJwt, {
        ...COOKIE_OPTIONS,
        expires: refreshExpiresAt,
      });
    } else {
      await setNativeSessionCookie(newAccessJwt, accessExpiresAt);
      const store = await cookies();
      store.set(REFRESH_COOKIE_NAME, newRefreshJwt, {
        ...COOKIE_OPTIONS,
        expires: refreshExpiresAt,
      });
    }
    return true;
  }

  if (options?.response) {
    setNativeSessionCookieOnResponse(options.response, accessJwt, accessExpiresAt);
    return true;
  }

  await setNativeSessionCookie(accessJwt, accessExpiresAt);
  return true;
}

export async function resolveNativeAuthUser(
  jwt: string | null | undefined,
  options?: { strict?: boolean },
): Promise<AuthUser | null> {
  if (!jwt) return null;
  const payload = await verifySessionJwt(jwt);
  if (!payload) return null;

  const sessionCached =
    !options?.strict &&
    getCachedNativeSessionValid(payload.sid, payload.sub);

  if (!sessionCached) {
    try {
      const session = await findValidAppSessionFromDb(payload.sid);
      if (!session || session.user_id !== payload.sub) return null;
      cacheNativeSessionValid(payload.sid, payload.sub);
    } catch (error) {
      if (options?.strict || !isPrismaUnreachableError(error)) {
        throw error;
      }
    }
  }

  if (!options?.strict) {
    const cached = getCachedNativeAuthUser(payload.sub);
    if (cached) return cached;
  }

  return loadAuthUserForPayload(payload);
}

export async function resolveNativeAuthUserWithRefresh(input: {
  accessJwt?: string | null;
  refreshJwt?: string | null;
  strict?: boolean;
  /** When false, never writes cookies (required for Server Components). */
  writeCookies?: boolean;
  response?: NextResponse;
}): Promise<AuthUser | null> {
  const fromAccess = await resolveNativeAuthUser(input.accessJwt, {
    strict: input.strict,
  });
  if (fromAccess) return fromAccess;

  if (input.strict) return null;

  if (input.writeCookies === false) {
    return resolveNativeAuthUserFromRefreshToken(input.refreshJwt);
  }

  const refreshed = await refreshNativeAccessFromRefreshToken(input.refreshJwt, {
    response: input.response,
  });
  if (!refreshed) return null;

  if (input.response) {
    const newAccessJwt = input.response.cookies.get(SESSION_COOKIE_NAME)?.value;
    return resolveNativeAuthUser(newAccessJwt);
  }

  const store = await cookies();
  return resolveNativeAuthUser(store.get(SESSION_COOKIE_NAME)?.value);
}

export async function getNativeAuthUserFromCookies(): Promise<AuthUser | null> {
  const store = await cookies();
  return resolveNativeAuthUserWithRefresh({
    accessJwt: store.get(SESSION_COOKIE_NAME)?.value,
    refreshJwt: store.get(REFRESH_COOKIE_NAME)?.value,
    writeCookies: false,
  });
}

export async function establishNativeSession(
  userId: string,
  options?: { userAgent?: string | null; ip?: string | null },
) {
  const tokens = await createNativeSession(userId, options);
  await setNativeSessionCookies(tokens);
  return tokens.accessJwt;
}
