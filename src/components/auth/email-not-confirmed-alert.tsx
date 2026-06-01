"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ResendConfirmationForm } from "@/components/auth/resend-confirmation-form";

function EmailNotConfirmedAlertInner() {
  const searchParams = useSearchParams();
  const unconfirmed = searchParams.get("unconfirmed") === "1";
  const email = searchParams.get("email")?.trim() ?? "";
  const expired = searchParams.get("expired") === "1";

  if (!unconfirmed && !expired) return null;

  return (
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50/90 px-4 py-4 text-sm text-amber-950">
      <p className="font-medium">
        {expired && !unconfirmed
          ? "Your confirmation link expired"
          : "Confirm your email to sign in"}
      </p>
      <p className="mt-1 text-amber-900/90">
        {expired && !unconfirmed
          ? "Request a new link below, then open it from the same device and browser when possible."
          : "We sent a confirmation link when you signed up. Check spam, or resend a new link below."}
      </p>
      <div className="mt-4">
        <ResendConfirmationForm
          defaultEmail={email}
          emailReadOnly={Boolean(email)}
          submitLabel="Send new confirmation link"
        />
      </div>
      {!email ? (
        <p className="mt-3 text-xs text-amber-800">
          Enter the same email you used to sign up.
        </p>
      ) : null}
    </div>
  );
}

export function EmailNotConfirmedAlert() {
  return (
    <Suspense fallback={null}>
      <EmailNotConfirmedAlertInner />
    </Suspense>
  );
}
