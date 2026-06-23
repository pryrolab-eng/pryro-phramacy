"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ResendConfirmationForm } from "@/components/auth/resend-confirmation-form";

function AuthConfirmPageInner() {
  const searchParams = useSearchParams();
  const handled = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (handled.current || typeof window === "undefined") return;
    handled.current = true;

    const token = searchParams.get("token");
    const next = searchParams.get("next") ?? "/onboarding";
    const error = searchParams.get("error");

    if (token) {
      const url = new URL("/api/auth/confirm-email", window.location.origin);
      url.searchParams.set("token", token);
      url.searchParams.set("next", next);
      window.location.replace(url.toString());
      return;
    }

    if (error) {
      setErrorMessage(decodeURIComponent(error));
      return;
    }

    setErrorMessage(
      "Use the confirmation link from your email, or request a new one below.",
    );
  }, [searchParams]);

  if (!errorMessage) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-neutral-50">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        <p className="text-sm text-neutral-500">Confirming your email…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-neutral-900">
          Email confirmation
        </h1>
        <p className="mt-2 text-sm text-neutral-600">{errorMessage}</p>
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
