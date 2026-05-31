import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";
import { PHARMACY_PERMISSIONS } from "@/lib/rbac/permissions";

/** Routes that require a specific RBAC permission (in addition to plan entitlements). */
export const PHARMACY_ROUTE_PERMISSION_MAP: ReadonlyArray<{
  prefix: string;
  permission: string;
}> = [
  { prefix: PHARMACY_ROUTES.staff, permission: PHARMACY_PERMISSIONS.staffManage },
  {
    prefix: PHARMACY_ROUTES.branches,
    permission: PHARMACY_PERMISSIONS.branchesManage,
  },
  {
    prefix: PHARMACY_ROUTES.billing,
    permission: PHARMACY_PERMISSIONS.billingSelfServe,
  },
].sort((a, b) => b.prefix.length - a.prefix.length);

export function resolveRoutePermission(pathname: string): string | null {
  const normalized = pathname.split("?")[0].replace(/\/$/, "") || "/";
  for (const { prefix, permission } of PHARMACY_ROUTE_PERMISSION_MAP) {
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
      return permission;
    }
  }
  return null;
}
