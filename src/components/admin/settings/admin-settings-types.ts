export type ScheduledMaintenance = {
  enabled: boolean;
  scheduledAt: string | null;
  message: string;
  notified: boolean;
};

export type AdminPlatformSettings = {
  platformName: string;
  platformLogoUrl: string;
  adminEmail: string;
  /** Shown on blocked-access screens and contact support links for pharmacies. */
  supportEmail: string;
  maxPharmacies: number;
  enableRegistrations: boolean;
  enableNotifications: boolean;
  scheduledMaintenance: ScheduledMaintenance;
  maxUsersPerPharmacy: number;
  apiRateLimit: number;
  enableWhiteLabel: boolean;
  enableMultiBranch: boolean;
  dataRetentionDays: number;
  enableAuditLogs: boolean;
  /** When true, users can opt in to 2FA under pharmacy Settings > Security. */
  allowUserTwoFactor: boolean;
  /** When true, platform admin console/API requires an allowlisted IP. */
  ipWhitelistEnabled: boolean;
};

export const defaultAdminPlatformSettings = (): AdminPlatformSettings => ({
  platformName: "Pryrox",
  platformLogoUrl: "",
  adminEmail: "admin@pryrox.com",
  supportEmail: "support@pryrox.com",
  maxPharmacies: 100,
  enableRegistrations: true,
  enableNotifications: true,
  scheduledMaintenance: {
    enabled: false,
    scheduledAt: null,
    message: "Scheduled maintenance — we'll be back shortly.",
    notified: false,
  },
  maxUsersPerPharmacy: 50,
  apiRateLimit: 1000,
  enableWhiteLabel: true,
  enableMultiBranch: true,
  dataRetentionDays: 2555,
  enableAuditLogs: true,
  allowUserTwoFactor: true,
  ipWhitelistEnabled: false,
});
