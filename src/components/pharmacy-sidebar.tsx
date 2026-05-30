"use client";

import { Pill } from "lucide-react";
import { DashboardRoleSidebar } from "@/components/sidebar/dashboard-role-sidebar";
import { PHARMACY_NAV_ITEMS } from "@/lib/subscription/nav-config";
import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";

export function PharmacySidebar(
  props: Omit<React.ComponentProps<typeof DashboardRoleSidebar>, "config">,
) {
  return (
    <DashboardRoleSidebar
      {...props}
      config={{
        brandHref: PHARMACY_ROUTES.dashboard,
        brandIcon: Pill,
        brandSubtitle: "Owner workspace",
        groupLabel: "Operations",
        roleLabel: "Pharmacy owner",
        userNameFallback: "Pharmacy Owner",
        navItems: PHARMACY_NAV_ITEMS,
        showUpgradeCard: true,
      }}
    />
  );
}
