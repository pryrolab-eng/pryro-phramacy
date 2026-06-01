"use client";

import { useEffect, useRef } from "react";
import { Mail } from "lucide-react";
import { ResendConfirmationForm } from "@/components/auth/resend-confirmation-form";
import { showVerificationToast } from "@/components/auth/verification-toast";

type Props = {
  initialEmail: string;
  linkExpired?: boolean;
};

export function VerifyEmailContent({ initialEmail, linkExpired }: Props) {
  const toastShown = useRef(false);

  useEffect(() => {
    if (toastShown.current) return;
    toastShown.current = true;
    showVerificationToast({
      message: linkExpired
        ? "Your link expired. Resend a new confirmation email below or from this notification."
        : "We sent a confirmation link. Check spam, or tap Resend email here.",
      email: initialEmail || undefined,
    });
  }, [initialEmail, linkExpired]);

  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-blue-950">
        <Mail className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
        <div>
          {linkExpired ? (
            <p className="font-medium">Your previous link expired</p>
          ) : (
            <p className="font-medium">We sent a confirmation link</p>
          )}
          {initialEmail ? (
            <p className="mt-1 text-blue-900/90">
              Open the email sent to{" "}
              <span className="font-medium">{initialEmail}</span> and click
              Confirm to continue to onboarding.
            </p>
          ) : (
            <p className="mt-1 text-blue-900/90">
              Open the email from Pryrox and click Confirm to continue.
            </p>
          )}
        </div>
      </div>

      <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
        <li>Check your spam or promotions folder</li>
        <li>Links expire after a while — request a new one below</li>
        <li>Use the same browser when opening the link if possible</li>
      </ul>

      <div>
        <p className="mb-3 text-sm font-medium text-gray-900">
          Didn&apos;t get the email?
        </p>
        <ResendConfirmationForm
          defaultEmail={initialEmail}
          emailReadOnly={Boolean(initialEmail)}
        />
      </div>
    </div>
  );
}
