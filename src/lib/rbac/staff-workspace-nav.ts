import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Stethoscope,
  Users,
} from "lucide-react";
import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";
import type { NavItemConfig } from "@/lib/subscription/nav-config";
import type { PharmacyMemberRole } from "@/lib/rbac/pharmacy-roles";

/** Capability keys — extend as RBAC grows. */
export type StaffNavPermission =
  | "workspace.home"
  | "clinical.dashboard"
  | "prescriptions.access"
  | "inventory.access"
  | "pos.access"
  | "sales.view"
  | "customers.access"
  | "settings.self";

const NAV_CATALOG: Record<
  StaffNavPermission,
  NavItemConfig & { permission: StaffNavPermission }
> = {
  "workspace.home": {
    permission: "workspace.home",
    title: "Dashboard",
    url: PHARMACY_ROUTES.staffDashboard,
    icon: LayoutDashboard,
    featureKey: "app.dashboard",
  },
  "clinical.dashboard": {
    permission: "clinical.dashboard",
    title: "Clinical",
    url: PHARMACY_ROUTES.pharmacist,
    icon: Stethoscope,
    featureKey: "app.dashboard",
  },
  "prescriptions.access": {
    permission: "prescriptions.access",
    title: "Prescriptions",
    url: PHARMACY_ROUTES.prescriptions,
    icon: FileText,
    featureKey: "prescriptions.access",
  },
  "inventory.access": {
    permission: "inventory.access",
    title: "Inventory",
    url: PHARMACY_ROUTES.inventory,
    icon: Package,
    featureKey: "inventory.access",
  },
  "pos.access": {
    permission: "pos.access",
    title: "POS",
    url: PHARMACY_ROUTES.pos,
    icon: ShoppingCart,
    featureKey: "pos.access",
  },
  "sales.view": {
    permission: "sales.view",
    title: "Sales",
    url: PHARMACY_ROUTES.sales,
    icon: BarChart3,
    featureKey: "sales.view",
  },
  "customers.access": {
    permission: "customers.access",
    title: "Customers",
    url: PHARMACY_ROUTES.customers,
    icon: Users,
    featureKey: "customers.access",
  },
  "settings.self": {
    permission: "settings.self",
    title: "My settings",
    url: PHARMACY_ROUTES.staffSettings,
    icon: Settings,
    featureKey: "settings.access",
    shortcutKeys: ["⌘", ","],
  },
};

import { loadRolePermissions } from "@/lib/rbac/permissions";

/** Nav items allowed for the given permission list (DB or fallback). */
export function getStaffWorkspaceNavItemsFromPermissions(
  permissions: readonly string[],
): NavItemConfig[] {
  return (Object.keys(NAV_CATALOG) as StaffNavPermission[])
    .filter((p) => permissions.includes(p))
    .map((p) => {
      const { permission: _perm, ...item } = NAV_CATALOG[p];
      return item;
    });
}

export function getStaffWorkspaceNavItems(
  role: string | null | undefined,
  permissions?: readonly string[],
): NavItemConfig[] {
  if (permissions?.length) {
    return getStaffWorkspaceNavItemsFromPermissions(permissions);
  }
  const key = (role ?? "staff") as PharmacyMemberRole;
  const fallback: StaffNavPermission[] =
    key === "pharmacist"
      ? [
          "workspace.home",
          "clinical.dashboard",
          "prescriptions.access",
          "inventory.access",
          "pos.access",
          "settings.self",
        ]
      : [
          "workspace.home",
          "pos.access",
          "sales.view",
          "customers.access",
          "settings.self",
        ];
  return getStaffWorkspaceNavItemsFromPermissions(fallback);
}

/** Server-side nav resolution using DB permissions. */
export async function getStaffWorkspaceNavItemsForUser(
  role: string | null | undefined,
): Promise<NavItemConfig[]> {
  const permissions = await loadRolePermissions(role);
  return getStaffWorkspaceNavItemsFromPermissions(permissions);
}

export function getStaffWorkspaceBrand(
  role: string | null | undefined,
  permissions?: readonly string[],
): { href: string; icon: LucideIcon; subtitle: string; roleLabel: string } {
  const items = getStaffWorkspaceNavItems(role, permissions);
  const home = items[0]?.url ?? PHARMACY_ROUTES.staffDashboard;
  const roleLabel =
    role === "pharmacist"
      ? "Pharmacist"
      : role === "cashier"
        ? "Cashier"
        : "Staff";
  return {
    href: home,
    icon: role === "pharmacist" ? Stethoscope : ShoppingCart,
    subtitle: "Team workspace",
    roleLabel,
  };
}
