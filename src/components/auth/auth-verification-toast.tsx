"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { showVerificationToast } from "@/components/auth/verification-toast";

/** One-time toast on sign-in when email is unconfirmed or link expired (?unconfirmed=1 / ?expired=1). */
export function AuthVerificationToast() {
  const searchParams = useSearchParams();
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;

    const unconfirmed = searchParams.get("unconfirmed") === "1";
    const expired = searchParams.get("expired") === "1";
    if (!unconfirmed && !expired) return;

    shown.current = true;
    const email = searchParams.get("email")?.trim() ?? undefined;

    if (unconfirmed) {
      showVerificationToast({
        message:
          "Confirm your email before signing in. Check spam or resend a new link.",
        email,
      });
      return;
    }

    showVerificationToast({
      message:
        "Your confirmation link may have expired. Resend a new link to continue.",
      email,
    });
  }, [searchParams]);

  return null;
}
