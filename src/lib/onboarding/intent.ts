export const ONBOARDING_INTENT_STORAGE_KEY = "pryrox_onboarding_intent";
export const ONBOARDING_INTENT_COOKIE = "pryrox_onboarding_intent";
export const ONBOARDING_INTENT_MAX_AGE_DAYS = 7;

export type BillingInterval = "monthly" | "annual";

export type OnboardingIntent = {
  planId: string;
  planName?: string;
  billing: BillingInterval;
  source?: "pricing" | "sign-up" | "sign-in";
};

export function buildSignUpUrl(options?: {
  planId?: string;
  planName?: string;
  billing?: BillingInterval;
}): string {
  if (!options?.planId) return "/sign-up";

  const params = new URLSearchParams();
  params.set("plan", options.planId);
  if (options.planName) params.set("plan_name", options.planName);
  if (options.billing === "annual") params.set("billing", "annual");
  return `/sign-up?${params.toString()}`;
}

export function buildSignInUrl(options?: {
  planId?: string;
  planName?: string;
  billing?: BillingInterval;
}): string {
  if (!options?.planId) return "/sign-in";

  const params = new URLSearchParams();
  params.set("plan", options.planId);
  if (options.planName) params.set("plan_name", options.planName);
  if (options.billing === "annual") params.set("billing", "annual");
  return `/sign-in?${params.toString()}`;
}

export function parseIntentFromSearchParams(
  params: Pick<URLSearchParams, "get">,
): OnboardingIntent | null {
  const planId = params.get("plan")?.trim();
  if (!planId) return null;

  const billing =
    params.get("billing") === "annual" ? "annual" : ("monthly" as const);
  const planName = params.get("plan_name")?.trim() || undefined;

  return { planId, planName, billing };
}

export function serializeIntent(intent: OnboardingIntent): string {
  return JSON.stringify(intent);
}

export function parseIntentJson(raw: string | null | undefined): OnboardingIntent | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as OnboardingIntent;
    if (!parsed?.planId) return null;
    return {
      planId: parsed.planId,
      planName: parsed.planName,
      billing: parsed.billing === "annual" ? "annual" : "monthly",
      source: parsed.source,
    };
  } catch {
    return null;
  }
}

export function matchPlanByIntent<T extends { id: string; name: string }>(
  plans: T[],
  intent: OnboardingIntent,
): T | undefined {
  const byId = plans.find((p) => p.id === intent.planId);
  if (byId) return byId;

  if (intent.planName) {
    const byStoredName = plans.find((p) => p.name === intent.planName);
    if (byStoredName) return byStoredName;
  }

  return undefined;
}
