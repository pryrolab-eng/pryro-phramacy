import type { NextRequest, NextResponse } from "next/server";
import {
  REFRESH_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/auth-mode";
import { setNativeSessionCookieOnResponse } from "@/lib/auth/native/session-cookie";
import {
  ACCESS_SESSION_TTL_MS,
  signSessionJwt,
  verifyRefreshJwt,
  verifySessionJwt,
} from "@/lib/auth/native/session-jwt";

/**
 * Edge-safe silent access refresh (JWT verify only — no DB session lookup).
 * Route handlers still validate app_sessions when strict auth is required.
 */
export async function trySilentNativeAccessRefresh(
  request: NextRequest,
  response: NextResponse,
): Promise<boolean> {
  const accessJwt = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (accessJwt && (await verifySessionJwt(accessJwt))) {
    return false;
  }

  const refreshJwt = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (!refreshJwt) return false;

  const payload = await verifyRefreshJwt(refreshJwt);
  if (!payload) return false;

  const accessExpiresAt = new Date(Date.now() + ACCESS_SESSION_TTL_MS);
  const newAccessJwt = await signSessionJwt(payload, accessExpiresAt);
  setNativeSessionCookieOnResponse(response, newAccessJwt, accessExpiresAt);
  return true;
}
