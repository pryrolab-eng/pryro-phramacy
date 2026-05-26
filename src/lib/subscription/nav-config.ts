import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";

export type NavItemConfig = {
  title: string;
  url: string;
  icon: LucideIcon;
  featureKey: string;
};

export const PHARMACY_NAV_ITEMS: NavItemConfig[] = [
  { title: "Dashboard", url: "/pharmacy-dashboard", icon: LayoutDashboard, featureKey: "app.dashboard" },
  { title: "Inventory", url: "/inventory", icon: Package, featureKey: "inventory.access" },
  { title: "POS", url: "/pos", icon: ShoppingCart, featureKey: "pos.access" },
  { title: "Sales", url: "/sales", icon: BarChart3, featureKey: "sales.view" },
  { title: "Customers", url: "/customers", icon: Users, featureKey: "customers.access" },
  { title: "Patients", url: "/patients", icon: UserPlus, featureKey: "patients.access" },
  { title: "Staff", url: "/staff", icon: UserCheck, featureKey: "staff.access" },
  { title: "Reports", url: "/reports", icon: FileText, featureKey: "reports.view" },
  { title: "Branches", url: "/branches", icon: Building2, featureKey: "branches.access" },
  { title: "Billing", url: "/pharmacy-dashboard/billing", icon: CreditCard, featureKey: "billing.self_serve" },
  { title: "Settings", url: "/settings", icon: Settings, featureKey: "settings.access" },
];

export const PHARMACIST_NAV_ITEMS: NavItemConfig[] = [
  { title: "Dashboard", url: "/pharmacist-dashboard", icon: LayoutDashboard, featureKey: "app.dashboard" },
  { title: "Prescriptions", url: "/prescriptions", icon: FileText, featureKey: "prescriptions.access" },
  { title: "Inventory", url: "/inventory", icon: Package, featureKey: "inventory.access" },
  { title: "POS", url: "/pos", icon: ShoppingCart, featureKey: "pos.access" },
  { title: "Settings", url: "/settings", icon: Settings, featureKey: "settings.access" },
];
