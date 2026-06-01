import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  authConfirmLandingUrl,
  getAppUrl,
} from "@/lib/auth/auth-redirect-urls";
import type { AuthEmailResult } from "@/lib/email/auth-emails";
import { isSmtpConfigured, sendMail } from "@/lib/email/mailer";
import { confirmationEmailHtml } from "@/lib/email/templates";

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

/** Admin generateLink + SMTP — used for signup fallback and resend. */
export async function sendConfirmationLinkViaSmtp(
  email: string,
  redirectTo = "/onboarding",
  password?: string,
): Promise<AuthEmailResult> {
  if (!isSmtpConfigured()) {
    return {
      ok: false,
      error:
        "Email could not be sent. SMTP is not configured and Supabase rate limit may apply. Try again later.",
    };
  }

  const admin = getAdminClient();
  const redirect = authConfirmLandingUrl(redirectTo);

  const { data, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email: email.trim(),
    password: password ?? "",
    options: { redirectTo: redirect },
  });

  if (error || !data?.properties?.action_link) {
    return {
      ok: false,
      error: error?.message ?? "Could not generate confirmation link",
    };
  }

  const link = data.properties.action_link;
  const subject = "Confirm your Pryrox account";
  const html = confirmationEmailHtml(link);
  const text = `Confirm your Pryrox account: ${link}`;

  try {
    await sendMail({ to: email.trim(), subject, html, text });
    return { ok: true, provider: "nodemailer" };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to send email";
    return { ok: false, error: message };
  }
}

export { getAppUrl };
