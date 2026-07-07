import { isSmtpConfigured, sendMail } from "./mailer";
import { getAppUrl } from "@/lib/app-url";
import { resolveEmailTemplate } from "@/lib/email/template-overrides";
import { escapeHtml } from "@/lib/email/layout";
import {
  invitationCredentialsBlock,
  invitationEmailHtml,
} from "@/lib/email/invitation-email";
import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";
import {
  DEFAULT_PLATFORM_SUPPORT_EMAIL,
  buildSupportMailto,
} from "@/lib/platform/support-email";

function roleLabel(role: string): string {
  if (role === "pharmacist") return "Pharmacist";
  if (role === "cashier") return "Cashier";
  if (role === "owner") return "Owner";
  if (role === "manager") return "Manager";
  return "Staff member";
}

function firstName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function staffInviteEmailHtml(options: {
  fullName: string;
  pharmacyName: string;
  role: string;
  signInUrl: string;
  temporaryPassword: string;
}): string {
  const { fullName, pharmacyName, role, signInUrl, temporaryPassword } =
    options;
  const label = roleLabel(role);
  const name = escapeHtml(firstName(fullName));
  const org = escapeHtml(pharmacyName);

  return invitationEmailHtml({
    preheader: `${pharmacyName} invited you to join their team on Pryrox as ${label}.`,
    greeting: `Hi, ${name}!`,
    introHtml: `<p style="margin:0 0 16px;">
        <strong style="color:#111827;">${org}</strong> has invited you to use
        <strong style="color:#111827;">Pryrox</strong> to work with their pharmacy team as a
        <strong style="color:#111827;">${escapeHtml(label)}</strong>.
        Click the button below to sign in and set up your account.
      </p>`,
    ctaLabel: "Set up your account",
    ctaUrl: signInUrl,
    extraBodyHtml: invitationCredentialsBlock({ signInUrl, temporaryPassword }),
    fallbackUrl: signInUrl,
  });
}

export function staffInviteEmailText(options: {
  fullName: string;
  pharmacyName: string;
  role: string;
  signInUrl: string;
  temporaryPassword: string;
}): string {
  const label = roleLabel(options.role);
  const name = firstName(options.fullName);
  const helpUrl = `${getAppUrl()}${PHARMACY_ROUTES.helpGettingStarted}`;
  const supportMailto = buildSupportMailto(
    DEFAULT_PLATFORM_SUPPORT_EMAIL,
    "Pryrox support",
  );

  return [
    `Hi, ${name}!`,
    ``,
    `${options.pharmacyName} has invited you to use Pryrox to work with their pharmacy team as a ${label}.`,
    ``,
    `Set up your account: ${options.signInUrl}`,
    ``,
    `Sign-in URL: ${options.signInUrl}`,
    `Temporary password: ${options.temporaryPassword}`,
    ``,
    `Change your password after your first sign-in.`,
    ``,
    `If you have questions, contact your pharmacy manager or ${supportMailto}.`,
    ``,
    `Welcome aboard,`,
    `The Pryrox Team`,
    ``,
    `P.S. Need help getting started? ${helpUrl}`,
    ``,
    `If the link above doesn't work, copy and paste this URL into your browser:`,
    options.signInUrl,
    ``,
    `© ${new Date().getFullYear()} Pryrox. All rights reserved.`,
  ].join("\n");
}

export type StaffInviteEmailResult =
  | { ok: true }
  | { ok: false; error: string; skipped?: boolean };

export async function sendStaffInviteEmail(options: {
  to: string;
  fullName: string;
  pharmacyName: string;
  role: string;
  temporaryPassword: string;
}): Promise<StaffInviteEmailResult> {
  if (!isSmtpConfigured()) {
    return {
      ok: false,
      skipped: true,
      error:
        "SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env to send invite emails.",
    };
  }

  const signInUrl = `${getAppUrl()}/sign-in`;
  const subject = `You're invited to join ${options.pharmacyName} on Pryrox`;

  const defaultHtml = staffInviteEmailHtml({
    fullName: options.fullName,
    pharmacyName: options.pharmacyName,
    role: options.role,
    signInUrl,
    temporaryPassword: options.temporaryPassword,
  });

  const defaultText = staffInviteEmailText({
    fullName: options.fullName,
    pharmacyName: options.pharmacyName,
    role: options.role,
    signInUrl,
    temporaryPassword: options.temporaryPassword,
  });

  try {
    const template = await resolveEmailTemplate({
      templateKey: "auth.staff_invite",
      subject,
      html: defaultHtml,
      text: defaultText,
      variables: {
        fullName: options.fullName,
        pharmacyName: options.pharmacyName,
        role: options.role === "pharmacist" ? "Pharmacist" : "Staff",
        roleLabel: roleLabel(options.role),
        signInUrl,
        temporaryPassword: options.temporaryPassword,
      },
    });

    await sendMail({
      to: options.to,
      subject: template.subject,
      html: template.html,
      text: template.text ?? defaultText,
    });
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to send invite email";
    return { ok: false, error: message };
  }
}
