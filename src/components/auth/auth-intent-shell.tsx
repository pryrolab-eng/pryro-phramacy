import { Suspense } from "react";
import { SignupIntentCapture } from "@/components/onboarding/signup-intent-capture";
import { AuthSearchParamsToast } from "@/components/auth/auth-search-params-toast";
import { AuthHashHandler } from "@/components/auth/auth-hash-handler";
import { AuthVerificationToast } from "@/components/auth/auth-verification-toast";

export function AuthIntentShell({ source }: { source: "sign-up" | "sign-in" }) {
  return (
    <Suspense fallback={null}>
      <AuthHashHandler />
      <AuthSearchParamsToast />
      <AuthVerificationToast />
      <SignupIntentCapture source={source} />
    </Suspense>
  );
}
