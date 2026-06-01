"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { createClient } from "../../../../supabase/client";
import { ResendConfirmationForm } from "@/components/auth/resend-confirmation-form";
import { showVerificationToast } from "@/components/auth/verification-toast";

function decodeAuthMessage(raw: string) {
  return decodeURIComponent(raw.replace(/\+/g, " "));
}

function AuthConfirmPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handled = useRef(false);
  const [errorState, setErrorState] = useState<{
    message: string;
    expired: boolean;
  } | null>(null);

  useEffect(() => {
    if (handled.current || typeof window === "undefined") return;

    const next = searchParams.get("next") ?? "/onboarding";
    const code = searchParams.get("code");
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    const hash = window.location.hash.slice(1);
    const hashParams = hash ? new URLSearchParams(hash) : null;

    const clearUrl = () => {
      const path = window.location.pathname + window.location.search;
      window.history.replaceState(null, "", path);
    };

    if (code) {
      handled.current = true;
      const url = new URL("/auth/callback", window.location.origin);
      url.searchParams.set("code", code);
      url.searchParams.set("next", next);
      window.location.replace(url.toString());
      return;
    }

    const errorCode = hashParams?.get("error_code");
    const errorDescription = hashParams?.get("error_description");
    const hashError = hashParams?.get("error");

    if (hashError || errorCode || errorDescription) {
      handled.current = true;
      let message = errorDescription
        ? decodeAuthMessage(errorDescription)
        : hashError
          ? decodeAuthMessage(hashError)
          : "Could not confirm your email.";
      const expired = errorCode === "otp_expired";
      if (expired) {
        message =
          "This confirmation link has expired. Request a new link below.";
      }
      clearUrl();
      setErrorState({ message, expired });
      showVerificationToast({
        message: expired
          ? "This confirmation link has expired. Resend a new confirmation email."
          : message,
      });
      return;
    }

    const finish = async () => {
      handled.current = true;
      const supabase = createClient();

      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as EmailOtpType,
        });
        if (error) {
          const expired = error.message.toLowerCase().includes("expired");
          setErrorState({
            message: error.message,
            expired,
          });
          showVerificationToast({
            message: expired
              ? "This confirmation link has expired. Resend a new confirmation email."
              : error.message,
          });
          return;
        }
        clearUrl();
        router.replace(next);
        router.refresh();
        return;
      }

      if (hashParams?.get("access_token")) {
        const { data, error } = await supabase.auth.getSession();
        clearUrl();
        if (error || !data.session) {
          setErrorState({
            message: error?.message ?? "Could not sign you in.",
            expired: false,
          });
          return;
        }
        router.replace(next);
        router.refresh();
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        clearUrl();
        router.replace(next);
        router.refresh();
        return;
      }

      if (!hash && !tokenHash) {
        router.replace("/sign-in");
      }
    };

    void finish();
  }, [router, searchParams]);

  if (errorState) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-12">
        <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-neutral-900">
            Email confirmation
          </h1>
          <p className="mt-2 text-sm text-neutral-600">{errorState.message}</p>
          <div className="mt-6">
            <ResendConfirmationForm submitLabel="Send new confirmation link" />
          </div>
          <p className="mt-6 text-center text-sm text-neutral-500">
            <Link
              href="/sign-in"
              className="font-medium text-blue-600 hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-neutral-50">
      <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      <p className="text-sm text-neutral-500">Confirming your email…</p>
    </div>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-neutral-50">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      }
    >
      <AuthConfirmPageInner />
    </Suspense>
  );
}
