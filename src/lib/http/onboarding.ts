import { fetchJson } from "./client";
import type { PlanRow } from "./plans";

export const onboardingKeys = {
  all: ["onboarding"] as const,
  status: () => [...onboardingKeys.all, "status"] as const,
};

export type OnboardingPharmacyInput = {
  name: string;
  license_number: string;
  city: string;
  address: string;
  phone: string;
  email: string;
};

export type OnboardingStatusResponse = {
  step?: number;
  pharmacy?: {
    id?: string;
    name?: string;
    license_number?: string | null;
    city?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  pendingPlan?: PlanRow | null;
  completed?: boolean;
  subscriptionActive?: boolean;
  isPlatformAdmin?: boolean;
  redirect?: string;
  needsPharmacyProfile?: boolean;
  error?: string;
};

export async function getOnboardingStatus(): Promise<OnboardingStatusResponse> {
  return fetchJson<OnboardingStatusResponse>("/api/onboarding/status", {
    credentials: "include",
  });
}

export async function submitOnboardingPharmacy(
  body: OnboardingPharmacyInput,
): Promise<{ pharmacyId?: string; error?: string }> {
  return fetchJson("/api/onboarding/pharmacy", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
