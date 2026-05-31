export const STAFF_SETTINGS_TAB_VALUES = [
  "workplace",
  "account",
  "security",
] as const;

export type StaffSettingsTabValue = (typeof STAFF_SETTINGS_TAB_VALUES)[number];

export function parseStaffSettingsTab(
  value: string | null | undefined,
): StaffSettingsTabValue {
  if (
    value &&
    STAFF_SETTINGS_TAB_VALUES.includes(value as StaffSettingsTabValue)
  ) {
    return value as StaffSettingsTabValue;
  }
  return "workplace";
}
