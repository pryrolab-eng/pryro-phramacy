import type { PharmacyMemberRole } from "@/lib/rbac/pharmacy-roles";
import { prisma } from "@/lib/db/prisma";

/** Capability keys — keep in sync with pharmacy_role_permissions seed migration. */
export const PHARMACY_PERMISSIONS = {
  workspaceHome: "workspace.home",
  clinicalDashboard: "clinical.dashboard",
  prescriptionsAccess: "prescriptions.access",
  inventoryAccess: "inventory.access",
  posAccess: "pos.access",
  salesView: "sales.view",
  customersAccess: "customers.access",
  patientsAccess: "patients.access",
  reportsView: "reports.view",
  settingsSelf: "settings.self",
  settingsPharmacy: "settings.pharmacy",
  staffManage: "staff.manage",
  branchesManage: "branches.manage",
  billingSelfServe: "billing.self_serve",
} as const;

export type PharmacyPermission =
  (typeof PHARMACY_PERMISSIONS)[keyof typeof PHARMACY_PERMISSIONS];

const FALLBACK_PERMISSIONS: Record<string, PharmacyPermission[]> = {
  pharmacy_owner: Object.values(PHARMACY_PERMISSIONS),
  pharmacist: [
    PHARMACY_PERMISSIONS.workspaceHome,
    PHARMACY_PERMISSIONS.clinicalDashboard,
    PHARMACY_PERMISSIONS.prescriptionsAccess,
    PHARMACY_PERMISSIONS.inventoryAccess,
    PHARMACY_PERMISSIONS.posAccess,
    PHARMACY_PERMISSIONS.settingsSelf,
  ],
  cashier: [
    PHARMACY_PERMISSIONS.workspaceHome,
    PHARMACY_PERMISSIONS.posAccess,
    PHARMACY_PERMISSIONS.salesView,
    PHARMACY_PERMISSIONS.customersAccess,
    PHARMACY_PERMISSIONS.settingsSelf,
  ],
  staff: [
    PHARMACY_PERMISSIONS.workspaceHome,
    PHARMACY_PERMISSIONS.posAccess,
    PHARMACY_PERMISSIONS.salesView,
    PHARMACY_PERMISSIONS.customersAccess,
    PHARMACY_PERMISSIONS.settingsSelf,
  ],
};

let permissionsCache: Map<string, PharmacyPermission[]> | null = null;
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 60_000;

export async function loadRolePermissions(
  role: string | null | undefined,
): Promise<PharmacyPermission[]> {
  const key = role ?? "staff";
  const now = Date.now();
  if (permissionsCache && now - cacheLoadedAt < CACHE_TTL_MS) {
    return permissionsCache.get(key) ?? FALLBACK_PERMISSIONS.staff;
  }

  const rows = await prisma.pharmacy_role_permissions.findMany({
    select: { role: true, permission: true },
  });

  if (!rows.length) {
    return FALLBACK_PERMISSIONS[key] ?? FALLBACK_PERMISSIONS.staff;
  }

  const map = new Map<string, PharmacyPermission[]>();
  for (const row of rows) {
    const r = String(row.role);
    const list = map.get(r) ?? [];
    list.push(row.permission as PharmacyPermission);
    map.set(r, list);
  }
  permissionsCache = map;
  cacheLoadedAt = now;
  return map.get(key) ?? FALLBACK_PERMISSIONS[key] ?? FALLBACK_PERMISSIONS.staff;
}

export function hasPermission(
  permissions: readonly string[] | null | undefined,
  permission: string,
): boolean {
  return (permissions ?? []).includes(permission);
}

export function isPharmacyMemberRole(
  role: string | null | undefined,
): role is PharmacyMemberRole {
  return (
    role === "pharmacy_owner" ||
    role === "pharmacist" ||
    role === "cashier" ||
    role === "staff"
  );
}
