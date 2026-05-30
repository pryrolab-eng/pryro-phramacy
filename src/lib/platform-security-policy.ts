import type { SupabaseClient } from "@supabase/supabase-js";

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
 * When false, 2FA setup is hidden and sign-in skips the 2FA step.
 */
export async function getAllowUserTwoFactor(
  supabase: SupabaseClient,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("system_settings")
    .select("setting_value")
    .eq("setting_key", PLATFORM_SECURITY_KEYS.allowUserTwoFactor)
    .is("pharmacy_id", null)
    .maybeSingle();

  if (error) {
    console.error("getAllowUserTwoFactor:", error);
    return true;
  }
  if (!data) return true;
  return parseBooleanSetting(data.setting_value, true);
}
