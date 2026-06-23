import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/auth-mode";
import {
  getNativeRefreshJwtFromRequest,
  getNativeSessionJwtFromRequest,
  resolveNativeAuthUserWithRefresh,
} from "@/lib/auth/native/session";
import type { AuthUser } from "@/lib/auth/types";

export type { AuthUser };

/** Server-side: resolve current user from native session cookies. */
export type GetAuthUserOptions = {
  /** Re-check app_sessions in DB (e.g. change-password). Default uses 60s cache. */
  strictNativeSession?: boolean;
};

export async function getAuthUser(
  request?: NextRequest,
  options?: GetAuthUserOptions,
): Promise<AuthUser | null> {
  const strict = options?.strictNativeSession === true;
  if (request) {
    return resolveNativeAuthUserWithRefresh({
      accessJwt: getNativeSessionJwtFromRequest(request),
      refreshJwt: getNativeRefreshJwtFromRequest(request),
      strict,
      writeCookies: true,
    });
  }

  const { cookies } = await import("next/headers");
  const store = await cookies();
  const { resolveNativeAuthUser, getNativeAuthUserFromCookies } = await import(
    "@/lib/auth/native/session"
  );

  if (strict) {
    return resolveNativeAuthUser(store.get(SESSION_COOKIE_NAME)?.value, {
      strict: true,
    });
  }
  return getNativeAuthUserFromCookies();
}

export async function requireAuthUser(request?: NextRequest): Promise<AuthUser> {
  const user = await getAuthUser(request);
  if (!user) throw new Error("Unauthorized");
  return user;
}
