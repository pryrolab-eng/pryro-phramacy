import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "../../../supabase/server";
import { authConfirmLandingUrl } from "@/lib/auth/auth-redirect-urls";
import type { AuthEmailResult } from "@/lib/email/auth-emails";
import { isSupabaseEmailRateLimited } from "@/lib/email/supabase-rate-limit";
import { sendConfirmationLinkViaSmtp } from "@/lib/email/send-confirmation-link";

function isBenignResendError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("already confirmed") ||
    m.includes("already registered") ||
    m.includes("user not found") ||
    m.includes("email address not authorized")
  );
}

/**
 * Resend signup confirmation for an existing unconfirmed account.
 * Always prefer generic success responses at the API layer for unknown emails.
 */
export async function sendConfirmationResendEmail(
  email: string,
  redirectTo = "/onboarding",
): Promise<AuthEmailResult> {
  const trimmed = email.trim();
  const redirect = authConfirmLandingUrl(redirectTo);

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: trimmed,
    options: { emailRedirectTo: redirect },
  });

  if (!error) {
    return { ok: true, provider: "supabase" };
  }

  if (isSupabaseEmailRateLimited(error as AuthError)) {
    console.warn(
      "[email] Supabase resend rate limited, falling back to nodemailer",
    );
    const fallback = await sendConfirmationLinkViaSmtp(trimmed, redirectTo);
    if (fallback.ok) return fallback;
    if (isBenignResendError(fallback.error)) {
      return { ok: true, provider: "nodemailer" };
    }
    return fallback;
  }

  if (isBenignResendError(error.message)) {
    return { ok: true, provider: "supabase" };
  }

  const fallback = await sendConfirmationLinkViaSmtp(trimmed, redirectTo);
  if (fallback.ok) return fallback;

  return { ok: false, error: error.message };
}
