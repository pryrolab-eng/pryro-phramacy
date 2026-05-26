"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPharmacySettings, pharmacySettingsKeys } from "@/lib/http/pharmacy-settings";
import { getSubscriptionPlans, plansKeys } from "@/lib/http/plans";
import { getPolarConfig, polarKeys } from "@/lib/http/polar";
import {
  cancelScheduledChange,
  getPlanLimits,
  getScheduledChange,
  getSubscriptionStatus,
  scheduleSubscriptionDowngrade,
  subscriptionKeys,
} from "@/lib/http/subscription";
import { validatePhoneNumber } from "@/lib/http/validation";

export function useSubscriptionPlansCatalog(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: plansKeys.catalog(),
    queryFn: getSubscriptionPlans,
    enabled: options?.enabled ?? true,
    staleTime: 0,
  });
}

export function usePharmacySubscriptionPlan(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: pharmacySettingsKeys.info(),
    queryFn: getPharmacySettings,
    enabled: options?.enabled ?? true,
    select: (data) => ({
      subscription: String(data.subscription ?? "standard").toLowerCase(),
      subscriptionExpiresAt: data.subscriptionExpiresAt ?? null,
    }),
  });
}

export function useSubscriptionStatusQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: subscriptionKeys.status(),
    queryFn: getSubscriptionStatus,
    enabled: options?.enabled ?? true,
  });
}

export function useScheduledChangeQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: subscriptionKeys.scheduledChange(),
    queryFn: getScheduledChange,
    enabled: options?.enabled ?? true,
  });
}

export function usePlanLimitsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: subscriptionKeys.planLimits(),
    queryFn: getPlanLimits,
    enabled: options?.enabled ?? true,
  });
}

export function usePolarConfigEnabled(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: polarKeys.config(),
    queryFn: getPolarConfig,
    enabled: options?.enabled ?? true,
    select: (data) => Boolean(data.enabled),
    staleTime: 5 * 60 * 1000,
  });
}

export function useInvalidateSubscriptionManagement() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: plansKeys.catalog() }),
      queryClient.invalidateQueries({ queryKey: pharmacySettingsKeys.info() }),
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.status() }),
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.scheduledChange(),
      }),
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.planLimits() }),
    ]);
}

export function useScheduleDowngradeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: scheduleSubscriptionDowngrade,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: subscriptionKeys.scheduledChange(),
      });
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.status() });
    },
  });
}

export function useCancelScheduledChangeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelScheduledChange,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: subscriptionKeys.scheduledChange(),
      });
    },
  });
}

export function useValidatePhoneMutation() {
  return useMutation({
    mutationFn: (phoneNumber: string) => validatePhoneNumber(phoneNumber),
  });
}
