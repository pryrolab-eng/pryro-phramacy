"use client";

import { toast } from "sonner";
import { sendResendConfirmationEmail } from "@/lib/http/auth";

async function resendConfirmationForEmail(email: string) {
  const trimmed = email.trim();
  if (!trimmed || !trimmed.includes("@")) {
    toast.error("Enter a valid email address to resend.");
    return;
  }

  const loadingId = toast.loading("Sending confirmation email…");
  try {
    const data = await sendResendConfirmationEmail({ email: trimmed });
    toast.dismiss(loadingId);
    toast.success(
      data.message ??
        "If an account exists for this email, we sent a new confirmation link.",
    );
  } catch (error) {
    toast.dismiss(loadingId);
    toast.error(
      error instanceof Error
        ? error.message
        : "Could not resend confirmation email.",
    );
  }
}

type VerificationToastOptions = {
  message: string;
  /** When set, Resend sends immediately; otherwise opens verify-email. */
  email?: string;
};

/** Auth verification errors with an inline Resend action in the toast. */
export function showVerificationToast({
  message,
  email,
}: VerificationToastOptions) {
  const hasEmail = Boolean(email?.trim());

  toast.error(message, {
    duration: 14_000,
    action: {
      label: "Resend email",
      onClick: () => {
        if (hasEmail) {
          void resendConfirmationForEmail(email!);
          return;
        }
        window.location.href = "/verify-email?expired=1";
      },
    },
  });
}

export function isVerificationRelatedError(raw: string): boolean {
  const lower = raw.toLowerCase();
  return (
    lower.includes("email not confirmed") ||
    lower.includes("email address not confirmed") ||
    lower.includes("invalid or has expired") ||
    lower.includes("otp_expired") ||
    lower.includes("link has expired") ||
    lower.includes("confirm your email")
  );
}
