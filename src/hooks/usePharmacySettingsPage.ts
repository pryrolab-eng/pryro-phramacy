"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBillingInfo,
  billingKeys,
  type BillingInfoResponse,
} from "@/lib/http/billing";
import {
  getPharmacyBranding,
  pharmacyBrandingKeys,
  updatePharmacyBranding,
  uploadPharmacyLogo,
  type PharmacyBranding,
} from "@/lib/http/pharmacy-branding";
import {
  getPharmacySettings,
  pharmacySettingsKeys,
  updatePharmacySettings,
  type UpdatePharmacySettingsInput,
} from "@/lib/http/pharmacy-settings";
import {
  createSettingsApiKey,
  getSettingsApiKeys,
  settingsApiKeysQueryKey,
  updateSettingsApiKey,
  type SettingsApiKeyRow,
} from "@/lib/http/settings-api-keys";
import {
  addIpWhitelistEntry,
  getIpWhitelist,
  getSecuritySettings,
  getTwoFaStatus,
  removeIpWhitelistEntry,
  setTwoFaEnabled,
  settingsSecurityKeys,
  setupTwoFa,
  updateSecuritySettings,
  verifyTwoFaToken,
} from "@/lib/http/settings-security";
import {
  createStockLocation,
  getStockLocations,
  stockLocationsQueryKey,
  type CreateStockLocationInput,
} from "@/lib/http/settings-locations";
import {
  getNotificationPreferences,
  notificationPrefsKeys,
  updateNotificationPreferences,
  type NotificationPrefsApi,
} from "@/lib/http/notification-preferences";

export { pharmacySettingsKeys } from "@/lib/http/pharmacy-settings";
export { pharmacyBrandingKeys } from "@/lib/http/pharmacy-branding";
export { usePharmacyBranding } from "./usePharmacyBranding";
export { billingKeys } from "@/lib/http/billing";
export { settingsSecurityKeys } from "@/lib/http/settings-security";
export { settingsApiKeysQueryKey } from "@/lib/http/settings-api-keys";
export { stockLocationsQueryKey } from "@/lib/http/settings-locations";

export type {
  PharmacySettings,
  UpdatePharmacySettingsInput,
} from "@/lib/http/pharmacy-settings";
export type { PharmacyBranding } from "@/lib/http/pharmacy-branding";
export type { BillingInfoResponse } from "@/lib/http/billing";
export type { SettingsApiKeyRow } from "@/lib/http/settings-api-keys";

export function usePharmacySettingsInfo(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: pharmacySettingsKeys.info(),
    queryFn: getPharmacySettings,
    enabled: options?.enabled ?? true,
  });
}

export function useBillingInfo(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: billingKeys.invoices(),
    queryFn: getBillingInfo,
    enabled: options?.enabled ?? true,
  });
}

export function useSecuritySettings(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: settingsSecurityKeys.settings(),
    queryFn: getSecuritySettings,
    enabled: options?.enabled ?? true,
  });
}

export function useTwoFaStatus(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: settingsSecurityKeys.twoFa(),
    queryFn: getTwoFaStatus,
    enabled: options?.enabled ?? true,
  });
}

export function useIpWhitelist(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: settingsSecurityKeys.ipWhitelist(),
    queryFn: getIpWhitelist,
    enabled: options?.enabled ?? true,
  });
}

export function useSettingsApiKeys(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: settingsApiKeysQueryKey,
    queryFn: getSettingsApiKeys,
    enabled: options?.enabled ?? true,
  });
}

export function useSettingsStockLocations(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: stockLocationsQueryKey,
    queryFn: getStockLocations,
    enabled: options?.enabled ?? true,
  });
}

export function useUpdatePharmacySettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdatePharmacySettingsInput) =>
      updatePharmacySettings(body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: pharmacySettingsKeys.info() }),
  });
}

export function useUpdatePharmacyBrandingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: PharmacyBranding) => updatePharmacyBranding(body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: pharmacyBrandingKeys.all }),
  });
}

export function useUploadPharmacyLogoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadPharmacyLogo,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: pharmacyBrandingKeys.all }),
  });
}

export function useUpdateSecuritySettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSecuritySettings,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: settingsSecurityKeys.settings(),
        }),
        queryClient.invalidateQueries({
          queryKey: settingsSecurityKeys.ipWhitelist(),
        }),
      ]),
  });
}

export function useSetTwoFaEnabledMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setTwoFaEnabled,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: settingsSecurityKeys.twoFa() }),
  });
}

export function useAddIpWhitelistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addIpWhitelistEntry,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: settingsSecurityKeys.ipWhitelist(),
      }),
  });
}

export function useRemoveIpWhitelistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeIpWhitelistEntry,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: settingsSecurityKeys.ipWhitelist(),
      }),
  });
}

export function useSetupTwoFaMutation() {
  return useMutation({ mutationFn: setupTwoFa });
}

export function useVerifyTwoFaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: verifyTwoFaToken,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: settingsSecurityKeys.twoFa() }),
  });
}

export function useCreateSettingsApiKeyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSettingsApiKey,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: settingsApiKeysQueryKey }),
  });
}

export function useUpdateSettingsApiKeyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSettingsApiKey,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: settingsApiKeysQueryKey }),
  });
}

export function useCreateSettingsLocationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateStockLocationInput) => createStockLocation(body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: stockLocationsQueryKey }),
  });
}

export function useNotificationPreferences(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: notificationPrefsKeys.all,
    queryFn: getNotificationPreferences,
    enabled: options?.enabled ?? true,
  });
}

export function useUpdateNotificationPreferencesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: NotificationPrefsApi) =>
      updateNotificationPreferences(body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationPrefsKeys.all }),
  });
}

export function useInvalidatePharmacySettingsPage() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: pharmacySettingsKeys.info() }),
      queryClient.invalidateQueries({ queryKey: pharmacyBrandingKeys.all }),
      queryClient.invalidateQueries({ queryKey: billingKeys.invoices() }),
      queryClient.invalidateQueries({ queryKey: notificationPrefsKeys.all }),
    ]);
}
