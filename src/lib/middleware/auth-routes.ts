/**
 * Middleware paths vs Next.js App Router file structure
 * ─────────────────────────────────────────────────────
 * Route groups in parentheses are NOT part of the URL:
 *
 *   src/app/(dashboard)/pos/page.tsx      →  /pos
 *   src/app/(dashboard)/inventory/page.tsx →  /inventory
 *   src/app/(auth)/sign-in/page.tsx       →  /sign-in
 *   src/app/page.tsx                       →  /  (marketing, no middleware)
 *
 * All pharmacy app pages live under src/app/(dashboard)/ and share
 * (dashboard)/layout.tsx (server auth + sidebar). Middleware lists the
 * URL prefixes below — keep in sync when adding new page.tsx files.
 */

import {
  CASHIER_NAV_ITEMS,
  PHARMACIST_NAV_ITEMS,
  PHARMACY_NAV_ITEMS,
  type NavItemConfig,
} from "@/lib/subscription/nav-config";

function navUrls(items: NavItemConfig[]): string[] {
  return items.map((item) => {
    const path = item.url.split("?")[0] ?? item.url;
    return path.endsWith("/") && path.length > 1
      ? path.slice(0, -1)
      : path;
  });
}

/** Unique top-level paths from sidebar nav (pharmacy operations). */
const NAV_PROTECTED_PATHS = Array.from(
  new Set([
    ...navUrls(PHARMACY_NAV_ITEMS),
    ...navUrls(PHARMACIST_NAV_ITEMS),
    ...navUrls(CASHIER_NAV_ITEMS),
  ]),
);

/**
 * App routes under (dashboard)/ or top-level app shells — require login.
 * Derived from src/app/.../page.tsx files + nav-config.
 */
export const PROTECTED_PATH_PREFIXES = Array.from(
  new Set([
    ...NAV_PROTECTED_PATHS,
    "/dashboard",
    "/superadmin",
    "/admin",
    "/onboarding",
    // Explicit (dashboard) pages not always in every role's nav
    "/activity",
    "/patients",
    "/reports",
  ]),
).sort() as readonly string[];

/** Login / register — public until session exists. (auth) route group. */
export const PUBLIC_AUTH_PATH_PREFIXES = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
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
