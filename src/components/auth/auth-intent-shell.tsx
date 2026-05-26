import { Suspense } from "react";
import { SignupIntentCapture } from "@/components/onboarding/signup-intent-capture";
import { AuthSearchParamsToast } from "@/components/auth/auth-search-params-toast";
import { AuthHashHandler } from "@/components/auth/auth-hash-handler";

export function AuthIntentShell({ source }: { source: "sign-up" | "sign-in" }) {
  return (
    <Suspense fallback={null}>
      <AuthHashHandler />
      <AuthSearchParamsToast />
      <SignupIntentCapture source={source} />
    </Suspense>
  );
}
