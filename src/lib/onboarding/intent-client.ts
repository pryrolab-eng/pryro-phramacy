"use client";

import {
  ONBOARDING_INTENT_COOKIE,
  ONBOARDING_INTENT_MAX_AGE_DAYS,
  ONBOARDING_INTENT_STORAGE_KEY,
  type BillingInterval,
  type OnboardingIntent,
  parseIntentFromSearchParams,
  parseIntentJson,
  serializeIntent,
} from "./intent";

function cookieMaxAgeSeconds() {
  return ONBOARDING_INTENT_MAX_AGE_DAYS * 24 * 60 * 60;
}

export function persistOnboardingIntent(intent: OnboardingIntent) {
  if (typeof window === "undefined") return;

  const payload = serializeIntent(intent);
  sessionStorage.setItem(ONBOARDING_INTENT_STORAGE_KEY, payload);
  document.cookie = `${ONBOARDING_INTENT_COOKIE}=${encodeURIComponent(payload)}; path=/; max-age=${cookieMaxAgeSeconds()}; SameSite=Lax`;
}

export function readOnboardingIntent(): OnboardingIntent | null {
  if (typeof window === "undefined") return null;

  const fromSession = parseIntentJson(
    sessionStorage.getItem(ONBOARDING_INTENT_STORAGE_KEY),
  );
  if (fromSession) return fromSession;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${ONBOARDING_INTENT_COOKIE}=`));
  if (!match) return null;

  const raw = decodeURIComponent(match.split("=").slice(1).join("="));
  const fromCookie = parseIntentJson(raw);
  if (fromCookie) {
    sessionStorage.setItem(ONBOARDING_INTENT_STORAGE_KEY, serializeIntent(fromCookie));
  }
  return fromCookie;
}

export function clearOnboardingIntent() {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem(ONBOARDING_INTENT_STORAGE_KEY);
  document.cookie = `${ONBOARDING_INTENT_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function captureIntentFromUrl(
  params: URLSearchParams,
  source: OnboardingIntent["source"] = "pricing",
) {
  const parsed = parseIntentFromSearchParams(params);
  if (!parsed) return null;

  const intent: OnboardingIntent = { ...parsed, source };
  persistOnboardingIntent(intent);
  return intent;
}

export function captureIntentFromPlanSelection(options: {
  planId: string;
  planName: string;
  billing: BillingInterval;
}) {
  const intent: OnboardingIntent = {
    planId: options.planId,
    planName: options.planName,
    billing: options.billing,
    source: "pricing",
  };
  persistOnboardingIntent(intent);
  return intent;
}
