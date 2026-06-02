import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";
import { isStaffWorkspaceRole } from "@/lib/rbac/pharmacy-roles";
import {
  canAccessBillingWhenBlocked,
  type PharmacyAccessBlockReason,
} from "@/lib/subscription/access-block";

export const BILLING_ROUTE = PHARMACY_ROUTES.billing;

const AUTH_ROUTES = ["/sign-in", "/sign-out"];

/** Role-specific dashboard shown when the subscription is inactive. */
export function resolveSubscriptionHomePath(
  role: string | null | undefined,
): string {
  if (isStaffWorkspaceRole(role)) return PHARMACY_ROUTES.staffDashboard;
  return PHARMACY_ROUTES.dashboard;
}

export function normalizeRoutePath(pathname: string): string {
  return pathname.split("?")[0].replace(/\/$/, "") || "/";
}

export function isBillingRoute(pathname: string): boolean {
  const normalized = normalizeRoutePath(pathname);
  return (
    normalized === BILLING_ROUTE ||
    normalized.startsWith(`${BILLING_ROUTE}/`) ||
    normalized === "/pharmacy-dashboard/billing" ||
    normalized.startsWith("/pharmacy-dashboard/billing/")
  );
}

export function isSubscriptionHomePath(
  pathname: string,
  role?: string | null,
): boolean {
  const normalized = normalizeRoutePath(pathname);
  const home = resolveSubscriptionHomePath(role);
  return normalized === home;
}

/** Routes reachable while dashboard access is blocked. */
export function isRouteAllowedWhenAccessBlocked(
  pathname: string,
  role: string | null | undefined,
  reason: PharmacyAccessBlockReason,
): boolean {
  if (reason === "none") return true;

  const normalized = normalizeRoutePath(pathname);

  if (
    AUTH_ROUTES.some(
      (route) => normalized === route || normalized.startsWith(`${route}/`),
    )
  ) {
    return true;
  }

  if (isSubscriptionHomePath(pathname, role)) return true;

  if (canAccessBillingWhenBlocked(reason) && isBillingRoute(pathname)) {
    return true;
  }

  return false;
}

/** @deprecated Use `isRouteAllowedWhenAccessBlocked` with `accessBlockReason`. */
export function isRouteAllowedWhenSubscriptionInactive(
  pathname: string,
  role?: string | null,
  reason: PharmacyAccessBlockReason = "subscription_expired",
): boolean {
  return isRouteAllowedWhenAccessBlocked(pathname, role, reason);
}

export function canReachRouteWhenAccessBlocked(
  href: string,
  reason: PharmacyAccessBlockReason,
): boolean {
  if (reason === "none") return true;
  return canAccessBillingWhenBlocked(reason) && isBillingRoute(href);
}

/** @deprecated Use `canReachRouteWhenAccessBlocked`. */
export function canReachRouteWhenSubscriptionInactive(href: string): boolean {
  return isBillingRoute(href);
}

export { isPharmacyOwnerRole } from "@/lib/rbac/pharmacy-roles";
