import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  Tag,
} from "lucide-react";

export type AdminNavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

/** Single source of truth for platform admin sidebar (SuperadminSidebar). */
export const ADMIN_SIDEBAR_NAV: AdminNavItem[] = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Pharmacy List", url: "/admin/stores", icon: Building2 },
  { title: "Categories", url: "/admin/categories", icon: Tag },
  { title: "Template Designer", url: "/admin/insurance-templates", icon: FileText },
  { title: "Subscriptions", url: "/admin/subscriptions", icon: CreditCard },
  { title: "Billing", url: "/admin/billing", icon: Receipt },
  { title: "Reports", url: "/admin/reports", icon: BarChart3 },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];
