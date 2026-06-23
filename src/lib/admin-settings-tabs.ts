export const ADMIN_SETTINGS_TAB_VALUES = [
  "profile",
  "general",
  "notifications",
  "tenants",
  "integrations",
  "security",
  "compliance",
  "operations",
  "analytics",
] as const;

export type AdminSettingsTabValue = (typeof ADMIN_SETTINGS_TAB_VALUES)[number];

export function parseAdminSettingsTab(
  value: string | null | undefined,
): AdminSettingsTabValue {
  if (
    value &&
    ADMIN_SETTINGS_TAB_VALUES.includes(value as AdminSettingsTabValue)
  ) {
    return value as AdminSettingsTabValue;
  }
  return "profile";
}
