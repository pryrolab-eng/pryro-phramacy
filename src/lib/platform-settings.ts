import {

  parseBooleanSetting,

  parseSystemSettingValue,

} from "@/lib/platform-security-policy";

import { defaultAdminPlatformSettings } from "@/components/admin/settings/admin-settings-types";

import { DEFAULT_PLATFORM_API_RATE_LIMIT } from "@/lib/rate-limit/presets";

import { isPrismaConfigured } from "@/lib/db/is-prisma-configured";



export const PLATFORM_SETTING_KEYS = {

  apiRateLimit: "apiRateLimit",
  adminEmail: "adminEmail",

  allowUserTwoFactor: "allowUserTwoFactor",

  ipWhitelistEnabled: "ipWhitelistEnabled",

  maxPharmacies: "maxPharmacies",

  enableRegistrations: "enableRegistrations",

  scheduledMaintenance: "scheduledMaintenance",

  maxUsersPerPharmacy: "maxUsersPerPharmacy",

  enableMultiBranch: "enableMultiBranch",

  enableWhiteLabel: "enableWhiteLabel",

  enableNotifications: "enableNotifications",

  enableAuditLogs: "enableAuditLogs",

  dataRetentionDays: "dataRetentionDays",

} as const;



const defaults = defaultAdminPlatformSettings();



export function parseNumberSetting(raw: unknown, defaultValue: number): number {

  const v = parseSystemSettingValue(raw);

  if (typeof v === "number" && Number.isFinite(v)) return Math.max(0, Math.floor(v));

  if (typeof v === "string" && v.trim() !== "") {

    const n = Number(v);

    if (Number.isFinite(n)) return Math.max(0, Math.floor(n));

  }

  return defaultValue;

}



type CacheEntry<T> = { value: T; expiresAt: number };

const settingCache = new Map<string, CacheEntry<unknown>>();

const CACHE_MS = 60_000;



export function invalidatePlatformSettingsCache(): void {

  settingCache.clear();

}



export function invalidatePlatformApiRateLimitCache(): void {

  settingCache.delete(PLATFORM_SETTING_KEYS.apiRateLimit);

}



async function loadPlatformSettingRaw(key: string): Promise<unknown | null> {

  if (!isPrismaConfigured()) return null;

  try {

    const { prisma } = await import("@/lib/db/prisma");

    const row = await prisma.system_settings.findFirst({

      where: { pharmacy_id: null, setting_key: key },

      select: { setting_value: true },

    });

    return row?.setting_value ?? null;

  } catch (error) {

    console.error(`loadPlatformSettingRaw(${key}):`, error);

    return null;

  }

}



async function getCachedPlatformSetting<T>(

  key: string,

  parse: (raw: unknown) => T,

  defaultValue: T,

): Promise<T> {

  const cached = settingCache.get(key);

  if (cached && Date.now() < cached.expiresAt) {

    return cached.value as T;

  }



  const raw = await loadPlatformSettingRaw(key);

  const value = raw === null ? defaultValue : parse(raw);

  settingCache.set(key, { value, expiresAt: Date.now() + CACHE_MS });

  return value;

}



export async function getPlatformApiRateLimit(): Promise<number> {

  return getCachedPlatformSetting(

    PLATFORM_SETTING_KEYS.apiRateLimit,

    (raw) => parseNumberSetting(raw, DEFAULT_PLATFORM_API_RATE_LIMIT),

    DEFAULT_PLATFORM_API_RATE_LIMIT,

  );

}

export async function getPlatformAdminEmail(): Promise<string> {
  return getCachedPlatformSetting(
    PLATFORM_SETTING_KEYS.adminEmail,
    (raw) => {
      const value = parseSystemSettingValue(raw);
      return typeof value === "string" && value.trim()
        ? value.trim()
        : defaults.adminEmail;
    },
    defaults.adminEmail,
  );
}



export async function getAllowUserTwoFactorFromDb(): Promise<boolean> {

  return getCachedPlatformSetting(

    PLATFORM_SETTING_KEYS.allowUserTwoFactor,

    (raw) => parseBooleanSetting(raw, defaults.allowUserTwoFactor),

    defaults.allowUserTwoFactor,

  );

}



export async function getMaxPharmacies(): Promise<number> {

  return getCachedPlatformSetting(

    PLATFORM_SETTING_KEYS.maxPharmacies,

    (raw) => parseNumberSetting(raw, defaults.maxPharmacies),

    defaults.maxPharmacies,

  );

}



export async function getEnableRegistrations(): Promise<boolean> {

  return getCachedPlatformSetting(

    PLATFORM_SETTING_KEYS.enableRegistrations,

    (raw) => parseBooleanSetting(raw, defaults.enableRegistrations),

    defaults.enableRegistrations,

  );

}



import type { ScheduledMaintenance } from "@/components/admin/settings/admin-settings-types";

export async function getScheduledMaintenance(): Promise<ScheduledMaintenance> {

  return getCachedPlatformSetting(

    PLATFORM_SETTING_KEYS.scheduledMaintenance,

    (raw) => {
      if (!raw) return defaults.scheduledMaintenance;
      try {
        const parsed = JSON.parse(String(raw));
        return {
          enabled: Boolean(parsed.enabled),
          scheduledAt: parsed.scheduledAt ?? null,
          message: String(parsed.message ?? defaults.scheduledMaintenance.message),
          notified: Boolean(parsed.notified),
        };
      } catch {
        return defaults.scheduledMaintenance;
      }
    },

    defaults.scheduledMaintenance,

  );

}

export async function isMaintenanceModeActive(): Promise<boolean> {
  const maintenance = await getScheduledMaintenance();
  if (!maintenance.enabled || !maintenance.scheduledAt) return false;
  return new Date(maintenance.scheduledAt) <= new Date();
}



export async function getMaxUsersPerPharmacy(): Promise<number> {

  return getCachedPlatformSetting(

    PLATFORM_SETTING_KEYS.maxUsersPerPharmacy,

    (raw) => parseNumberSetting(raw, defaults.maxUsersPerPharmacy),

    defaults.maxUsersPerPharmacy,

  );

}



export async function getEnableMultiBranch(): Promise<boolean> {

  return getCachedPlatformSetting(

    PLATFORM_SETTING_KEYS.enableMultiBranch,

    (raw) => parseBooleanSetting(raw, defaults.enableMultiBranch),

    defaults.enableMultiBranch,

  );

}



export async function getEnableWhiteLabel(): Promise<boolean> {

  return getCachedPlatformSetting(

    PLATFORM_SETTING_KEYS.enableWhiteLabel,

    (raw) => parseBooleanSetting(raw, defaults.enableWhiteLabel),

    defaults.enableWhiteLabel,

  );

}



export async function getEnableNotifications(): Promise<boolean> {

  return getCachedPlatformSetting(

    PLATFORM_SETTING_KEYS.enableNotifications,

    (raw) => parseBooleanSetting(raw, defaults.enableNotifications),

    defaults.enableNotifications,

  );

}







export async function getEnableAuditLogs(): Promise<boolean> {

  return getCachedPlatformSetting(

    PLATFORM_SETTING_KEYS.enableAuditLogs,

    (raw) => parseBooleanSetting(raw, defaults.enableAuditLogs),

    defaults.enableAuditLogs,

  );

}



export async function getDataRetentionDays(): Promise<number> {

  return getCachedPlatformSetting(

    PLATFORM_SETTING_KEYS.dataRetentionDays,

    (raw) => parseNumberSetting(raw, defaults.dataRetentionDays),

    defaults.dataRetentionDays,

  );

}


