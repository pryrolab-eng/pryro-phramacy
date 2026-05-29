"use client";

import { ShoppingCart } from "lucide-react";
import { DashboardRoleSidebar } from "@/components/sidebar/dashboard-role-sidebar";
import { CASHIER_NAV_ITEMS } from "@/lib/subscription/nav-config";

export function CashierSidebar(
  props: Omit<React.ComponentProps<typeof DashboardRoleSidebar>, "config">,
) {
  return (
    <DashboardRoleSidebar
      {...props}
      config={{
        brandHref: "/pos",
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
