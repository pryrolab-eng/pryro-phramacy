"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../supabase/client";
import { showVerificationToast } from "@/components/auth/verification-toast";

function decodeAuthMessage(raw: string) {
  return decodeURIComponent(raw.replace(/\+/g, " "));
}

/**
 * Supabase puts confirmation results in the URL hash (#error=... or #access_token=...).
 * The server never sees the hash, so this must run on the client.
 */
export function AuthHashHandler() {
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current || typeof window === "undefined") return;

    const hash = window.location.hash.slice(1);
    if (!hash) return;

    handled.current = true;
    const params = new URLSearchParams(hash);
    const errorCode = params.get("error_code");
    const errorDescription = params.get("error_description");
    const error = params.get("error");

    const clearHash = () => {
      const path = window.location.pathname + window.location.search;
      window.history.replaceState(null, "", path);
    };

    if (error || errorCode || errorDescription) {
      let message = errorDescription
        ? decodeAuthMessage(errorDescription)
        : error
          ? decodeAuthMessage(error)
          : "Could not complete sign in.";

      clearHash();

      if (errorCode === "otp_expired") {
        showVerificationToast({
          message:
            "This confirmation link has expired. Resend a new confirmation email.",
        });
        router.replace("/verify-email?expired=1");
        return;
      }

      showVerificationToast({
        message,
      });
      router.replace("/sign-in?expired=1");
      return;
    }

    const supabase = createClient();
    void supabase.auth.getSession().then(({ data: { session } }) => {
      clearHash();
      if (session) {
        router.refresh();
      }
    });
  }, [router]);

  return null;
}
