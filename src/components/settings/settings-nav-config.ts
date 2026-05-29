import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Building2,
  Globe,
  Palette,
  Shield,
  BarChart3,
  FileText,
  Zap,
} from "lucide-react";
import type { SettingsTabValue } from "@/lib/settings-tabs";

export type SettingsNavItem = {
  id: SettingsTabValue;
  label: string;
  icon: LucideIcon;
};

export type SettingsNavGroup = {
  label: string;
  items: SettingsNavItem[];
};

/** Plan-gated settings tabs — shown under Features, not Workspace. */
export const SETTINGS_TAB_FEATURE_KEYS: Partial<
  Record<SettingsTabValue, string>
> = {
  branding: "customization",
};

export const SETTINGS_NAV_GROUPS: SettingsNavGroup[] = [
  {
    label: "Account",
    items: [
      { id: "general", label: "General", icon: Globe },
      { id: "notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "Workspace",
    items: [
      { id: "security", label: "Security", icon: Shield },
      { id: "integrations", label: "Integrations", icon: Zap },
      { id: "operations", label: "Operations", icon: Building2 },
      { id: "compliance", label: "Compliance", icon: FileText },
      { id: "analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Features",
    items: [{ id: "branding", label: "Branding", icon: Palette }],
  },
];

export function getSettingsTabFeatureKey(
  tab: SettingsTabValue,
): string | undefined {
  return SETTINGS_TAB_FEATURE_KEYS[tab];
}

export function getAllSettingsNavItems(): SettingsNavItem[] {
  return SETTINGS_NAV_GROUPS.flatMap((group) => group.items);
}

export function getSettingsTabLabel(tab: SettingsTabValue): string {
  return getAllSettingsNavItems().find((i) => i.id === tab)?.label ?? "General";
}
