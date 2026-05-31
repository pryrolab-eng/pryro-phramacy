import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";
import {
  isPharmacyOwnerRole,
  isStaffWorkspaceRole,
} from "@/lib/rbac/pharmacy-roles";

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

/** Routes reachable while the pharmacy subscription is inactive (renew flow only). */
export function isRouteAllowedWhenSubscriptionInactive(
  pathname: string,
  role?: string | null,
): boolean {
  const normalized = normalizeRoutePath(pathname);

  if (isSubscriptionHomePath(pathname, role)) return true;
  if (isBillingRoute(pathname)) return true;

  return AUTH_ROUTES.some(
    (route) => normalized === route || normalized.startsWith(`${route}/`),
  );
}

export function canReachRouteWhenSubscriptionInactive(href: string): boolean {
  return isBillingRoute(href);
}

export { isPharmacyOwnerRole } from "@/lib/rbac/pharmacy-roles";
