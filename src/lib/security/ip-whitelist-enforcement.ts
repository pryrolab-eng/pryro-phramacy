import type { NextRequest } from "next/server";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";
import { resolveActivePharmacyId } from "@/lib/pharmacy/active-pharmacy";
import { getClientIpFromHeaders } from "@/lib/security/ip-address";
import {
  getPharmacyIpWhitelistPolicy,
  getPlatformIpWhitelistPolicy,
  isIpAllowedByPolicy,
  shouldEnforceIpWhitelist,
} from "@/lib/security/ip-whitelist-policy";

const WEBHOOK_API_PREFIXES = [
  "/api/polar/webhook",
  "/api/cron/",
] as const;

const AUTH_API_PREFIX = "/api/auth/";

const IP_MANAGEMENT_PREFIXES = [
  "/api/settings/security",
  "/api/settings/security/ip-whitelist",
  "/api/admin/ip-whitelist",
  "/api/admin/system-settings",
  "/api/me/context",
] as const;

export function isIpWhitelistBypassPath(pathname: string): boolean {
  if (pathname === "/access-denied") return true;
  if (pathname.startsWith(AUTH_API_PREFIX)) return true;
  if (WEBHOOK_API_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (IP_MANAGEMENT_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  return false;
}

export function isAdminScopePath(pathname: string): boolean {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/superadmin" ||
    pathname.startsWith("/superadmin/") ||
    pathname === "/api/admin" ||
    pathname.startsWith("/api/admin/")
  );
}

export function isPharmacyScopePath(pathname: string): boolean {
  return (
    pathname === "/pharmacy" ||
    pathname.startsWith("/pharmacy/") ||
    pathname.startsWith("/api/pharmacy/") ||
    pathname.startsWith("/api/pos/") ||
    pathname.startsWith("/api/inventory") ||
    pathname.startsWith("/api/sales") ||
    pathname.startsWith("/api/customers") ||
    pathname.startsWith("/api/reports/") ||
    pathname.startsWith("/api/staff") ||
    pathname.startsWith("/api/branches") ||
    pathname.startsWith("/api/subscriptions/") ||
    pathname.startsWith("/api/insurance") ||
    pathname.startsWith("/api/prescriptions") ||
    pathname.startsWith("/api/dashboard") ||
    pathname.startsWith("/api/alerts") ||
    pathname.startsWith("/api/notifications") ||
    pathname.startsWith("/api/settings/") ||
    pathname.startsWith("/api/me/")
  );
}

export type IpWhitelistDecision =
  | { allowed: true }
  | { allowed: false; scope: "platform" | "pharmacy"; clientIp: string };

export async function evaluateIpWhitelistForRequest(
  request: NextRequest,
  userId: string,
): Promise<IpWhitelistDecision> {
  if (!shouldEnforceIpWhitelist()) {
    return { allowed: true };
  }

  const pathname = request.nextUrl.pathname;
  if (isIpWhitelistBypassPath(pathname)) {
    return { allowed: true };
  }

  const clientIp = getClientIpFromHeaders(request.headers);

  if (isAdminScopePath(pathname)) {
    const isPlatformAdmin = await resolveIsAppPlatformAdmin(userId);
    if (!isPlatformAdmin) {
      return { allowed: true };
    }
    const policy = await getPlatformIpWhitelistPolicy();
    if (!isIpAllowedByPolicy(clientIp, policy)) {
      return { allowed: false, scope: "platform", clientIp };
    }
    return { allowed: true };
  }

  if (isPharmacyScopePath(pathname)) {
    const pharmacyId = await resolveActivePharmacyId(userId);
    if (!pharmacyId) {
      return { allowed: true };
    }
    const policy = await getPharmacyIpWhitelistPolicy(pharmacyId);
    if (!isIpAllowedByPolicy(clientIp, policy)) {
      return { allowed: false, scope: "pharmacy", clientIp };
    }
    return { allowed: true };
  }

  return { allowed: true };
}
