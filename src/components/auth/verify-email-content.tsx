"use client";

import { useEffect, useRef } from "react";
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
