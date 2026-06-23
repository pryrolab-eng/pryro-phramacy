"use client";

import { startTransition, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { isEmailNotConfirmedMessage } from "@/lib/auth/email-not-confirmed";
import {
  isVerificationRelatedError,
  showVerificationToast,
} from "@/components/auth/verification-toast";
import { stripSensitiveAuthQueryParams } from "@/lib/auth/sensitive-query-params";

const AUTH_ERROR_LABELS: Record<string, string> = {
  "no-pharmacy": "No pharmacy access found. Please contact support.",
  "setup-failed": "Account setup failed. Please try again.",
  "no-pharmacy-access":
    "You don't have access to any pharmacy. Please contact your administrator.",
};

function resolveErrorMessage(raw: string) {
    if (isEmailNotConfirmedMessage(raw)) {
    return "Please confirm your email before signing in. Use Resend email in this notification.";
  }
  return AUTH_ERROR_LABELS[raw] ?? decodeURIComponent(raw);
}

/** Shows ?error= and ?success= from auth redirects as Sonner toasts, then cleans the URL. */
export function AuthSearchParamsToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const shown = useRef<string | null>(null);

  useEffect(() => {
    const error = searchParams.get("error");
    const success = searchParams.get("success");
    const email = searchParams.get("email")?.trim() ?? undefined;
    if (!error && !success) {
      shown.current = null;
      return;
    }

    const key = `${error ?? ""}|${success ?? ""}`;
    if (shown.current === key) return;
    shown.current = key;

    if (error) {
      const decoded = decodeURIComponent(error);
      if (
        isEmailNotConfirmedMessage(decoded) ||
        isVerificationRelatedError(decoded)
      ) {
        showVerificationToast({
          message: resolveErrorMessage(error),
          email,
        });
      } else {
        toast.error(resolveErrorMessage(error));
      }
    }
    if (success) toast.success(decodeURIComponent(success));

    const { sanitized: params } = stripSensitiveAuthQueryParams(
      new URLSearchParams(searchParams.toString()),
    );
    params.delete("error");
    params.delete("success");
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    });
  }, [pathname, router, searchParams]);

  return null;
}
