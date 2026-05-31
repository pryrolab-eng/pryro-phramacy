"use client";

import { DashboardRoleSidebar } from "@/components/sidebar/dashboard-role-sidebar";
import { useActivePharmacy } from "@/components/providers/active-pharmacy-provider";
import {
  getStaffWorkspaceBrand,
  getStaffWorkspaceNavItems,
} from "@/lib/rbac/staff-workspace-nav";

export function StaffWorkspaceSidebar(
  props: Omit<React.ComponentProps<typeof DashboardRoleSidebar>, "config">,
) {
  const { context } = useActivePharmacy();
  const role = context.role;
  const brand = getStaffWorkspaceBrand(role, context.permissions);
  const navItems = getStaffWorkspaceNavItems(role, context.permissions);

  return (
    <DashboardRoleSidebar
      {...props}
      config={{
        brandHref: brand.href,
        brandIcon: brand.icon,
        brandSubtitle: brand.subtitle,
        groupLabel: "Workspace",
        roleLabel: brand.roleLabel,
        userNameFallback: brand.roleLabel,
        navItems,
        showUpgradeCard: false,
      }}
    />
  );
}
