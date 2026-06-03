/** Shared auth redirect URLs for email links and OAuth. */

export { getAppUrl } from "@/lib/app-url";

import { getAppUrl } from "@/lib/app-url";

/** Server route: exchange PKCE `code` and set session cookies. */
export function authCallbackUrl(nextPath: string): string {
  const url = new URL("/auth/callback", getAppUrl());
  url.searchParams.set("next", nextPath);
  return url.toString();
}

/**
 * Client page: handles hash tokens and forwards `code` to `/auth/callback`.
 * Use as `emailRedirectTo` for signup confirmation.
 */
export function authConfirmLandingUrl(nextPath: string): string {
  const url = new URL("/auth/confirm", getAppUrl());
  url.searchParams.set("next", nextPath);
  return url.toString();
}

export function recoveryRedirectUrl(path: string): string {
  return new URL(path, getAppUrl()).toString();
}
