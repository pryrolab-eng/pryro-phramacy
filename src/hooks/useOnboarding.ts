"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getOnboardingStatus,
  onboardingKeys,
  submitOnboardingPharmacy,
  type OnboardingPharmacyInput,
} from "@/lib/http/onboarding";
import { getSubscriptionPlans, plansKeys } from "@/lib/http/plans";
import { getPolarConfig, polarKeys } from "@/lib/http/polar";
import { upgradeSubscription } from "@/lib/http/subscription";
import { validatePhoneNumber } from "@/lib/http/validation";

export { onboardingKeys } from "@/lib/http/onboarding";
export { plansKeys } from "@/lib/http/plans";

export function useOnboardingStatus(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: onboardingKeys.status(),
    queryFn: getOnboardingStatus,
    enabled: options?.enabled ?? true,
    retry: false,
  });
}

export function useOnboardingPlans(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: plansKeys.catalog(),
    queryFn: async () => {
      const list = await getSubscriptionPlans();
      return list.filter((p) => p.plan_type !== "branch_addon");
    },
    enabled: options?.enabled ?? true,
  });
}

export function usePolarConfig(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: polarKeys.config(),
    queryFn: getPolarConfig,
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubmitOnboardingPharmacyMutation() {
  return useMutation({
    mutationFn: (body: OnboardingPharmacyInput) => submitOnboardingPharmacy(body),
  });
}

export function useUpgradeSubscriptionMutation() {
  return useMutation({
    mutationFn: (planId: string) => upgradeSubscription(planId),
  });
}

export function useValidatePhoneMutation() {
  return useMutation({
    mutationFn: (phoneNumber: string) => validatePhoneNumber(phoneNumber),
  });
}
