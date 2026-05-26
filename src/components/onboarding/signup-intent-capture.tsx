"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { captureIntentFromUrl } from "@/lib/onboarding/intent-client";

type Props = {
  source?: "pricing" | "sign-up" | "sign-in";
};

/** Persists ?plan= from the URL into session + cookie so it survives email confirm. */
export function SignupIntentCapture({ source = "sign-up" }: Props) {
  const searchParams = useSearchParams();

  useEffect(() => {
    captureIntentFromUrl(searchParams, source);
  }, [searchParams, source]);

  return null;
}
