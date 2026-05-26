import { Suspense } from "react";
import { AuthHashHandler } from "@/components/auth/auth-hash-handler";
import OnboardingForm from "./onboarding-form";

function OnboardingFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-neutral-50">
      <p className="text-sm text-neutral-500">Loading…</p>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingFallback />}>
      <AuthHashHandler />
      <OnboardingForm />
    </Suspense>
  );
}
