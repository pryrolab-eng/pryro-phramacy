import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "../../../supabase/server";
import {
  authConfirmLandingUrl,
  authCallbackUrl,
  recoveryRedirectUrl,
} from "@/lib/auth/auth-redirect-urls";
import { sendConfirmationLinkViaSmtp } from "@/lib/email/send-confirmation-link";
import { recoveryEmailHtml } from "./templates";
import { isSmtpConfigured, sendMail } from "./mailer";
import { isSupabaseEmailRateLimited } from "./supabase-rate-limit";
import { RESET_PASSWORD_PATH } from "@/lib/middleware/auth-routes";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AuthEmailResult =
  | { ok: true; provider: "supabase" | "nodemailer" }
  | { ok: false; error: string };

function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase admin credentials are not configured");
  }
  return createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function sendRecoveryViaSmtp(
  email: string,
  redirectTo: string,
): Promise<AuthEmailResult> {
  if (!isSmtpConfigured()) {
    return {
      ok: false,
      error:
        "Supabase email rate limit reached and SMTP fallback is not configured. Add SMTP_* variables to .env or wait before retrying.",
    };
  }

  const admin = getAdminClient();
  const redirect = recoveryRedirectUrl(redirectTo);

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: redirect },
  });

  if (error || !data?.properties?.action_link) {
    return {
      ok: false,
      error: error?.message ?? "Could not generate auth link",
    };
  }

  const link = data.properties.action_link;
  const subject = "Reset your Pryrox password";
  const html = recoveryEmailHtml(link);
  const text = `Reset your Pryrox password: ${link}`;

  try {
    await sendMail({ to: email, subject, html, text });
    return { ok: true, provider: "nodemailer" };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to send email";
    return { ok: false, error: message };
  }
}

/** Password reset: Supabase first, Nodemailer + admin link on rate limit. */
export async function sendPasswordRecoveryEmail(
  email: string,
  redirectTo = RESET_PASSWORD_PATH,
): Promise<AuthEmailResult> {
  const redirect = recoveryRedirectUrl(redirectTo);

  const admin = getAdminClient();
  const { error } = await admin.auth.resetPasswordForEmail(email, {
    redirectTo: redirect,
  });

  if (!error) {
    return { ok: true, provider: "supabase" };
  }

  if (isSupabaseEmailRateLimited(error)) {
    console.warn(
      "[email] Supabase recovery rate limited, falling back to nodemailer",
    );
    return sendRecoveryViaSmtp(email, redirectTo);
  }

  return { ok: false, error: error.message };
}

/** Sign-up: Supabase signUp first; on rate limit use admin link + nodemailer. */
export async function sendSignupConfirmationEmail(options: {
  email: string;
  password: string;
  fullName?: string;
  redirectTo?: string;
}): Promise<
  AuthEmailResult & {
    sessionCreated?: boolean;
    userId?: string;
  }
> {
  const { email, password, fullName, redirectTo = "/onboarding" } = options;
  const redirect = authConfirmLandingUrl(redirectTo);

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: fullName ? { full_name: fullName } : undefined,
      emailRedirectTo: redirect,
    },
  });

  if (!error) {
    if (data.session) {
      return {
        ok: true,
        provider: "supabase",
        sessionCreated: true,
        userId: data.user?.id,
      };
    }
    return { ok: true, provider: "supabase", sessionCreated: false };
  }

  if (isSupabaseEmailRateLimited(error as AuthError)) {
    console.warn(
      "[email] Supabase signup email rate limited, falling back to nodemailer",
    );
    const fallback = await sendConfirmationLinkViaSmtp(
      email,
      redirectTo,
      password,
    );
    return { ...fallback, sessionCreated: false };
  }

  return { ok: false, error: error.message };
}

/** @deprecated Use authConfirmLandingUrl from auth-redirect-urls */
export function callbackUrl(redirectTo: string): string {
  return authCallbackUrl(redirectTo);
}
