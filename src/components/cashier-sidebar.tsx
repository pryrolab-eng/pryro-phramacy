"use client";

import { ShoppingCart } from "lucide-react";
import { DashboardRoleSidebar } from "@/components/sidebar/dashboard-role-sidebar";
import { CASHIER_NAV_ITEMS } from "@/lib/subscription/nav-config";
import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";

export function CashierSidebar(
  props: Omit<React.ComponentProps<typeof DashboardRoleSidebar>, "config">,
) {
  return (
    <DashboardRoleSidebar
      {...props}
      config={{
        brandHref: PHARMACY_ROUTES.pos,
        brandIcon: ShoppingCart,
        brandSubtitle: "Point of sale",
        groupLabel: "Register",
        roleLabel: "Cashier",
        userNameFallback: "Staff",
        navItems: CASHIER_NAV_ITEMS,
      }}
    />
  );
}
