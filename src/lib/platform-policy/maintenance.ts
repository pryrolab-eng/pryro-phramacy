const MAINTENANCE_EXEMPT_EXACT = new Set([
  "/maintenance",
  "/sign-in",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/access-denied",
]);

const MAINTENANCE_EXEMPT_PREFIXES = [
  "/api/auth/",
  "/api/cron/",
  "/api/polar/webhook",
  "/admin",
  "/superadmin",
] as const;

export function isMaintenanceExemptPath(pathname: string): boolean {
  if (MAINTENANCE_EXEMPT_EXACT.has(pathname)) return true;
  return MAINTENANCE_EXEMPT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
