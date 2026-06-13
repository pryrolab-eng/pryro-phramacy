import type { NextResponse } from "next/server";
import {
  REFRESH_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/auth-mode";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setNativeSessionCookieOnResponse(
  response: NextResponse,
  jwt: string,
  expiresAt: Date,
) {
  response.cookies.set(SESSION_COOKIE_NAME, jwt, {
    ...COOKIE_OPTIONS,
    expires: expiresAt,
  });
}

export function clearNativeSessionCookieOnResponse(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });
  response.cookies.set(REFRESH_COOKIE_NAME, "", {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });
}
