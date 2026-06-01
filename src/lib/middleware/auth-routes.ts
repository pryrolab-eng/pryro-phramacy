/**
 * Middleware paths vs Next.js App Router file structure
 * ─────────────────────────────────────────────────────
 * Route groups in parentheses are NOT part of the URL:
 *
 *   src/app/(dashboard)/pharmacy/(shared)/pos/page.tsx  →  /pharmacy/pos
 *   src/app/(auth)/sign-in/page.tsx                     →  /sign-in
 *
 * Pharmacy tenant pages live under src/app/(dashboard)/pharmacy/.
 * Platform admin pages live under src/app/(dashboard)/admin/.
 */

import {
  CASHIER_NAV_ITEMS,
  PHARMACIST_NAV_ITEMS,
  PHARMACY_NAV_ITEMS,
  type NavItemConfig,
} from "@/lib/subscription/nav-config";
import { POST_AUTH_ENTRY_PATH } from "@/lib/auth/resolve-home-redirect";
import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";

function navUrls(items: NavItemConfig[]): string[] {
  return items.map((item) => {
    const path = item.url.split("?")[0] ?? item.url;
    return path.endsWith("/") && path.length > 1
      ? path.slice(0, -1)
      : path;
  });
}

/** Unique paths from sidebar nav (pharmacy tenant). */
const NAV_PROTECTED_PATHS = Array.from(
  new Set([
    ...navUrls(PHARMACY_NAV_ITEMS),
    ...navUrls(PHARMACIST_NAV_ITEMS),
    ...navUrls(CASHIER_NAV_ITEMS),
  ]),
);

/**
 * App routes that require login.
 * Derived from nav-config + explicit shells.
 */
export const PROTECTED_PATH_PREFIXES = Array.from(
  new Set([
    PHARMACY_ROUTES.root,
    ...NAV_PROTECTED_PATHS,
    POST_AUTH_ENTRY_PATH,
    "/superadmin",
    "/admin",
    "/onboarding",
  ]),
).sort() as readonly string[];

/** Password reset after recovery email link. Lives in (auth) route group. */
export const RESET_PASSWORD_PATH = "/reset-password";

/** Login / register — public until session exists. (auth) route group. */
export const PUBLIC_AUTH_PATH_PREFIXES = [
  "/sign-in",
  "/sign-up",
  "/verify-email",
  "/forgot-password",
  RESET_PASSWORD_PATH,
] as const;

/** OAuth / 2FA — must not redirect mid-flow. */
export const AUTH_PROCESSING_PATH_PREFIXES = [
  "/auth/",
  "/auth-success",
  "/verify-2fa",
] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function isPublicAuthPath(pathname: string): boolean {
  return PUBLIC_AUTH_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function isAuthProcessingPath(pathname: string): boolean {
  return (
    pathname.startsWith("/auth/") ||
    pathname === "/auth-success" ||
    pathname.startsWith("/verify-2fa")
  );
}

export function middlewareShouldRun(pathname: string): boolean {
  return (
    isProtectedPath(pathname) ||
    isPublicAuthPath(pathname) ||
    isAuthProcessingPath(pathname)
  );
}
