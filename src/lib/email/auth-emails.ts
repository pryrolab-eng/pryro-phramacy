import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { AuthError, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "../../../supabase/server";
import { isSmtpConfigured, sendMail } from "./mailer";
import { confirmationEmailHtml, recoveryEmailHtml } from "./templates";
import { isSupabaseEmailRateLimited } from "./supabase-rate-limit";

export type AuthEmailResult =
  | { ok: true; provider: "supabase" | "nodemailer" }
  | { ok: false; error: string };

function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!url) throw new Error("NEXT_PUBLIC_APP_URL is not configured");
  return url;
}

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

function callbackUrl(redirectTo: string): string {
  const url = new URL("/auth/callback", getAppUrl());
  url.searchParams.set("next", redirectTo);
  return url.toString();
}

/** Recovery links go straight to the reset page so the client can exchange the code. */
function recoveryRedirectUrl(redirectTo: string): string {
  return new URL(redirectTo, getAppUrl()).toString();
}

async function sendViaNodemailer(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<AuthEmailResult> {
  if (!isSmtpConfigured()) {
    return {
      ok: false,
      error:
        "Supabase email rate limit reached and SMTP fallback is not configured. Add SMTP_* variables to .env or wait before retrying.",
    };
  }

  try {
    await sendMail({ to, subject, html, text });
    return { ok: true, provider: "nodemailer" };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to send email";
    return { ok: false, error: message };
  }
}

async function generateLinkAndSend(
  type: "signup" | "recovery",
  email: string,
  redirectTo: string,
  password?: string,
  redirectOverride?: string
): Promise<AuthEmailResult> {
  const admin = getAdminClient();
  const redirect =
    redirectOverride ??
    (type === "recovery" ? recoveryRedirectUrl(redirectTo) : callbackUrl(redirectTo));

  const { data, error } = await admin.auth.admin.generateLink({
    type,
    email,
    password: type === "signup" ? password : undefined,
    options: { redirectTo: redirect },
  });

  if (error || !data?.properties?.action_link) {
    return {
      ok: false,
      error: error?.message ?? "Could not generate auth link",
    };
  }

  const link = data.properties.action_link;
  const subject =
    type === "signup" ? "Confirm your Pryrox account" : "Reset your Pryrox password";
  const html =
    type === "signup"
      ? confirmationEmailHtml(link)
      : recoveryEmailHtml(link);
  const text =
    type === "signup"
      ? `Confirm your Pryrox account: ${link}`
      : `Reset your Pryrox password: ${link}`;

  return sendViaNodemailer(email, subject, html, text);
}

/** Password reset: Supabase first, Nodemailer + admin link on rate limit. */
export async function sendPasswordRecoveryEmail(
  email: string,
  redirectTo = "/dashboard/reset-password"
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
      "[email] Supabase recovery rate limited, falling back to nodemailer"
    );
    return generateLinkAndSend("recovery", email, redirectTo, undefined, redirect);
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
  const appUrl = getAppUrl();
  const redirect = callbackUrl(redirectTo);

  const supabase = createClient();

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
      "[email] Supabase signup email rate limited, falling back to nodemailer"
    );
    const fallback = await generateLinkAndSend(
      "signup",
      email,
      redirectTo,
      password
    );
    return { ...fallback, sessionCreated: false };
  }

  return { ok: false, error: error.message };
}
