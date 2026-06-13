import { getAppUrl } from "@/lib/app-url";

import { RESET_PASSWORD_PATH } from "@/lib/middleware/auth-routes";

import {

  signEmailConfirmToken,

  signPasswordResetToken,

} from "@/lib/auth/native/auth-tokens";

import { findAuthUserByEmailFromDb } from "@/lib/db/auth-credentials";

import type { AuthEmailResult } from "@/lib/email/auth-email-types";

import { confirmationEmailHtml, recoveryEmailHtml } from "@/lib/email/templates";

import { isSmtpConfigured, sendMail } from "@/lib/email/mailer";



function nativeResetLink(token: string): string {

  const url = new URL(RESET_PASSWORD_PATH, getAppUrl());

  url.searchParams.set("native_token", token);

  return url.toString();

}



function nativeConfirmLink(token: string, nextPath: string): string {

  const url = new URL("/api/auth/confirm-email", getAppUrl());

  url.searchParams.set("token", token);

  url.searchParams.set("next", nextPath);

  return url.toString();

}



/** Native password reset — always returns ok to avoid email enumeration. */

export async function sendNativePasswordRecoveryEmail(

  email: string,

): Promise<AuthEmailResult> {

  if (!isSmtpConfigured()) {

    return {

      ok: false,

      error:

        "Email is not configured. Add SMTP_* variables to .env to send password reset links.",

    };

  }



  const row = await findAuthUserByEmailFromDb(email);

  if (!row) {

    return { ok: true, provider: "nodemailer" };

  }



  const token = await signPasswordResetToken(row.id);

  const link = nativeResetLink(token);

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



export async function sendNativeSignupConfirmationEmail(options: {

  userId: string;

  email: string;

  redirectTo?: string;

}): Promise<AuthEmailResult> {

  if (!isSmtpConfigured()) {

    return {

      ok: false,

      error:

        "Email is not configured. Add SMTP_* variables to .env to send confirmation links.",

    };

  }



  const redirectTo = options.redirectTo ?? "/onboarding";

  const token = await signEmailConfirmToken(options.userId, options.email);

  const link = nativeConfirmLink(token, redirectTo);

  const subject = "Confirm your Pryrox email";

  const html = confirmationEmailHtml(link);

  const text = `Confirm your Pryrox email: ${link}`;



  try {

    await sendMail({ to: options.email, subject, html, text });

    return { ok: true, provider: "nodemailer" };

  } catch (e) {

    const message = e instanceof Error ? e.message : "Failed to send email";

    return { ok: false, error: message };

  }

}



export async function sendNativeConfirmationResendEmail(

  email: string,

  redirectTo = "/onboarding",

): Promise<AuthEmailResult> {

  const row = await findAuthUserByEmailFromDb(email);

  if (!row) {

    return { ok: true, provider: "nodemailer" };

  }

  if (row.email_confirmed_at) {

    return { ok: true, provider: "nodemailer" };

  }

  return sendNativeSignupConfirmationEmail({

    userId: row.id,

    email: row.email ?? email,

    redirectTo,

  });

}


