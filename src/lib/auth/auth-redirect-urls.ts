/** Shared auth redirect URLs for email links and OAuth. */

import { getAppUrl } from "@/lib/app-url";
import { sanitizeRedirectPath, buildSafeRedirectUrl } from "@/lib/auth/trusted-origins";

/** Server route: exchange PKCE `code` and set session cookies. */
export function authCallbackUrl(nextPath: string): string {
  const safePath = sanitizeRedirectPath(nextPath, "/onboarding");
  const url = new URL("/auth/callback", getAppUrl());
  url.searchParams.set("next", safePath);
  return url.toString();
}

/**
 * Client page: handles hash tokens and forwards `code` to `/auth/callback`.
 * Use as `emailRedirectTo` for signup confirmation.
 */
export function authConfirmLandingUrl(nextPath: string): string {
  const safePath = sanitizeRedirectPath(nextPath, "/onboarding");
  const url = new URL("/auth/confirm", getAppUrl());
  url.searchParams.set("next", safePath);
  return url.toString();
}

export function recoveryRedirectUrl(path: string): string {
  const safePath = sanitizeRedirectPath(path, "/onboarding");
  return buildSafeRedirectUrl(safePath);
}
