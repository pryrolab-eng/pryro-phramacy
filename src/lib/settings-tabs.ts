export const SETTINGS_TAB_VALUES = [
  "general",
  "notifications",
  "branding",
  "security",
  "integrations",
  "operations",
  "compliance",
  "analytics",
] as const;

export type SettingsTabValue = (typeof SETTINGS_TAB_VALUES)[number];

export function parseSettingsTab(
  value: string | null | undefined,
): SettingsTabValue {
  if (
    value &&
    SETTINGS_TAB_VALUES.includes(value as SettingsTabValue)
  ) {
    return value as SettingsTabValue;
  }
  return "general";
}
