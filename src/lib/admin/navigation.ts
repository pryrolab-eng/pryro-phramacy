import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  Layers,
  Receipt,
  Settings,
  Tag,
} from "lucide-react";
import { ADMIN_ROUTES } from "@/lib/routes/admin-paths";

export type AdminNavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  /** Optional search keywords for command palette */
  keywords?: string;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

/** Grouped platform admin sidebar — single source of truth. */
export const ADMIN_SIDEBAR_GROUPS: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/admin",
        icon: LayoutDashboard,
        keywords: "home overview metrics",
      },
    ],
  },
  {
    label: "Tenants & catalog",
    items: [
      {
        title: "Pharmacies",
        url: "/admin/stores",
        icon: Building2,
        keywords: "stores tenants pharmacies list",
      },
      {
        title: "Categories",
        url: "/admin/categories",
        icon: Tag,
        keywords: "product categories catalog",
      },
      {
        title: "Insurance templates",
        url: ADMIN_ROUTES.insuranceTemplates,
        icon: FileText,
        keywords: "template designer claims insurance providers",
      },
    ],
  },
  {
    label: "Plans & revenue",
    items: [
      {
        title: "Subscriptions",
        url: "/admin/subscriptions",
        icon: CreditCard,
        keywords: "plans pricing saas",
      },
      {
        title: "Features",
        url: "/admin/features",
        icon: Layers,
        keywords: "entitlements feature flags",
      },
      {
        title: "Billing",
        url: "/admin/billing",
        icon: Receipt,
        keywords: "payments transactions invoices",
      },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        title: "Reports",
        url: "/admin/reports",
        icon: BarChart3,
        keywords: "analytics exports",
      },
    ],
  },
  {
    label: "Platform",
    items: [
      {
        title: "AI Audit Logs",
        url: "/admin/ai-trace-events",
        icon: Activity,
        keywords: "ai nemotron drug safety analytics audit trace",
      },
      {
        title: "Settings",
        url: "/admin/settings",
        icon: Settings,
        keywords: "configuration security system",
      },
    ],
  },
];

/** Flat list for command palette and legacy imports. */
export const ADMIN_SIDEBAR_NAV: AdminNavItem[] = ADMIN_SIDEBAR_GROUPS.flatMap(
  (group) => group.items,
);

export function isAdminNavItemActive(pathname: string, url: string): boolean {
  if (url === "/admin") {
    return pathname === "/admin" || pathname === "/superadmin";
  }
  return pathname === url || pathname.startsWith(`${url}/`);
}
