import { getAllowUserTwoFactorFromDb } from "@/lib/platform-settings";

export const PLATFORM_SECURITY_KEYS = {
  allowUserTwoFactor: "allowUserTwoFactor",
} as const;

/** Parse jsonb `setting_value` from system_settings. */
export function parseSystemSettingValue(raw: unknown): unknown {
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw === "object" && raw !== null && "value" in raw) {
    return (raw as { value: unknown }).value;
  }
  return raw;
}

export function parseBooleanSetting(raw: unknown, defaultValue: boolean): boolean {
  const v = parseSystemSettingValue(raw);
  if (typeof v === "boolean") return v;
  if (v === "true") return true;
  if (v === "false") return false;
  return defaultValue;
}

/**
 * Platform-wide: when true, pharmacy owners/staff may enable 2FA on their own account.
 */
export async function getAllowUserTwoFactor(): Promise<boolean> {
  return getAllowUserTwoFactorFromDb();
}
