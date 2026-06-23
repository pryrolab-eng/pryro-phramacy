import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  Building2,
  FileText,
  Globe,
  Shield,
  User,
  Users,
  Zap,
} from "lucide-react";
import type { AdminSettingsTabValue } from "@/lib/admin-settings-tabs";

export type AdminSettingsNavItem = {
  id: AdminSettingsTabValue;
  label: string;
  icon: LucideIcon;
};

export type AdminSettingsNavGroup = {
  label: string;
  items: AdminSettingsNavItem[];
};

export const ADMIN_SETTINGS_NAV_GROUPS: AdminSettingsNavGroup[] = [
  {
    label: "Account",
    items: [
      { id: "profile", label: "Profile", icon: User },
      { id: "general", label: "General", icon: Globe },
      { id: "notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "Platform",
    items: [
      { id: "tenants", label: "Tenants", icon: Users },
      { id: "security", label: "Security", icon: Shield },
    ],
  },
  {
    label: "Workspace",
    items: [
      { id: "integrations", label: "Integrations", icon: Zap },
      { id: "operations", label: "Operations", icon: Building2 },
      { id: "compliance", label: "Compliance", icon: FileText },
      { id: "analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
];

export function getAllAdminSettingsNavItems(): AdminSettingsNavItem[] {
  return ADMIN_SETTINGS_NAV_GROUPS.flatMap((group) => group.items);
}

export function getAdminSettingsTabLabel(tab: AdminSettingsTabValue): string {
  return getAllAdminSettingsNavItems().find((i) => i.id === tab)?.label ?? "General";
}
