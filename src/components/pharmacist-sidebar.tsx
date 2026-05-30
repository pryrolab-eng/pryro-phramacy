"use client";

import { Stethoscope } from "lucide-react";
import { DashboardRoleSidebar } from "@/components/sidebar/dashboard-role-sidebar";
import { PHARMACIST_NAV_ITEMS } from "@/lib/subscription/nav-config";
import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";

export function PharmacistSidebar(
  props: Omit<React.ComponentProps<typeof DashboardRoleSidebar>, "config">,
) {
  return (
    <DashboardRoleSidebar
      {...props}
      config={{
        brandHref: PHARMACY_ROUTES.pharmacist,
        brandIcon: Stethoscope,
        brandSubtitle: "Pharmacist",
        groupLabel: "Clinical",
        roleLabel: "Pharmacist",
        userNameFallback: "Pharmacist",
        navItems: PHARMACIST_NAV_ITEMS,
      }}
    />
  );
}
