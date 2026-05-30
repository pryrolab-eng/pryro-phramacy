export type AdminPlatformSettings = {
  platformName: string;
  platformLogoUrl: string;
  adminEmail: string;
  maxPharmacies: number;
  enableRegistrations: boolean;
  enableNotifications: boolean;
  maintenanceMode: boolean;
  backupEnabled: boolean;
  autoUpdates: boolean;
  maxUsersPerPharmacy: number;
  apiRateLimit: number;
  enableWhiteLabel: boolean;
  enableMultiBranch: boolean;
  dataRetentionDays: number;
  enableAuditLogs: boolean;
  ssoEnabled: boolean;
  encryptionEnabled: boolean;
  /** When true, users can opt in to 2FA under pharmacy Settings → Security. */
  allowUserTwoFactor: boolean;
};

export const defaultAdminPlatformSettings = (): AdminPlatformSettings => ({
  platformName: "Pryrox",
  platformLogoUrl: "",
  adminEmail: "admin@pryrox.com",
  maxPharmacies: 100,
  enableRegistrations: true,
  enableNotifications: true,
  maintenanceMode: false,
  backupEnabled: true,
  autoUpdates: true,
  maxUsersPerPharmacy: 50,
  apiRateLimit: 1000,
  enableWhiteLabel: true,
  enableMultiBranch: true,
  dataRetentionDays: 2555,
  enableAuditLogs: true,
  ssoEnabled: false,
  encryptionEnabled: true,
  allowUserTwoFactor: true,
});
