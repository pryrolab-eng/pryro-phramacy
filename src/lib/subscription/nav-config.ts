import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  History,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";

export type NavItemConfig = {
  title: string;
  url: string;
  icon: LucideIcon;
  featureKey: string;
  /** Shown on the right in the sidebar (hidden when collapsed). */
  shortcutKeys?: string[];
};

export const PHARMACY_NAV_ITEMS: NavItemConfig[] = [
  { title: "Dashboard", url: PHARMACY_ROUTES.dashboard, icon: LayoutDashboard, featureKey: "app.dashboard" },
  { title: "Inventory", url: PHARMACY_ROUTES.inventory, icon: Package, featureKey: "inventory.access" },
  { title: "POS", url: PHARMACY_ROUTES.pos, icon: ShoppingCart, featureKey: "pos.access" },
  { title: "Sales", url: PHARMACY_ROUTES.sales, icon: BarChart3, featureKey: "sales.view" },
  { title: "Customers", url: PHARMACY_ROUTES.customers, icon: Users, featureKey: "customers.access" },
  { title: "Patients", url: PHARMACY_ROUTES.patients, icon: UserPlus, featureKey: "patients.access" },
  { title: "Staff", url: PHARMACY_ROUTES.staff, icon: UserCheck, featureKey: "staff.access" },
  { title: "Reports", url: PHARMACY_ROUTES.reports, icon: FileText, featureKey: "reports.view" },
  { title: "Activity", url: PHARMACY_ROUTES.activity, icon: History, featureKey: "reports.view" },
  { title: "Branches", url: PHARMACY_ROUTES.branches, icon: Building2, featureKey: "branches.access" },
  { title: "Billing", url: PHARMACY_ROUTES.billing, icon: CreditCard, featureKey: "billing.self_serve" },
  { title: "Settings", url: PHARMACY_ROUTES.settings, icon: Settings, featureKey: "settings.access", shortcutKeys: ["⌘", ","] },
];

export const PHARMACIST_NAV_ITEMS: NavItemConfig[] = [
  { title: "Dashboard", url: PHARMACY_ROUTES.pharmacist, icon: LayoutDashboard, featureKey: "app.dashboard" },
  { title: "Prescriptions", url: PHARMACY_ROUTES.prescriptions, icon: FileText, featureKey: "prescriptions.access" },
  { title: "Inventory", url: PHARMACY_ROUTES.inventory, icon: Package, featureKey: "inventory.access" },
  { title: "POS", url: PHARMACY_ROUTES.pos, icon: ShoppingCart, featureKey: "pos.access" },
  { title: "Settings", url: PHARMACY_ROUTES.settings, icon: Settings, featureKey: "settings.access", shortcutKeys: ["⌘", ","] },
];

/** Cashier and staff: POS-first navigation */
export const CASHIER_NAV_ITEMS: NavItemConfig[] = [
  { title: "POS", url: PHARMACY_ROUTES.pos, icon: ShoppingCart, featureKey: "pos.access" },
  { title: "Sales", url: PHARMACY_ROUTES.sales, icon: BarChart3, featureKey: "sales.view" },
  { title: "Customers", url: PHARMACY_ROUTES.customers, icon: Users, featureKey: "customers.access" },
  { title: "Settings", url: PHARMACY_ROUTES.settings, icon: Settings, featureKey: "settings.access", shortcutKeys: ["⌘", ","] },
];

export function isCashierLikeRole(role: string | null | undefined): boolean {
  return role === "cashier" || role === "staff";
}
