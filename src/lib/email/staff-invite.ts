import { isSmtpConfigured, sendMail } from "./mailer";
import { getAppUrl } from "@/lib/app-url";
import { resolveEmailTemplate } from "@/lib/email/template-overrides";

export function staffInviteEmailHtml(options: {
  fullName: string;
  pharmacyName: string;
  role: string;
  signInUrl: string;
  temporaryPassword: string;
}): string {
  const { fullName, pharmacyName, role, signInUrl, temporaryPassword } =
    options;
  const roleLabel = role === "pharmacist" ? "Pharmacist" : "Staff";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>You're invited to Pryrox</title></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#111;max-width:520px;margin:0 auto;padding:24px;">
  <h1 style="font-size:20px;margin:0 0 16px;">You're invited to ${pharmacyName}</h1>
  <p>Hi ${fullName},</p>
  <p>You've been added to <strong>${pharmacyName}</strong> on Pryrox as <strong>${roleLabel}</strong>.</p>
  <p>Sign in with the credentials below, then change your password from your account settings after your first login.</p>
  <div style="margin:20px 0;padding:16px;border:1px solid #e5e5e5;border-radius:8px;background:#fafafa;">
    <p style="margin:0 0 8px;font-size:13px;color:#525252;">Sign-in URL</p>
    <p style="margin:0 0 16px;font-size:14px;word-break:break-all;"><a href="${signInUrl}" style="color:#111;">${signInUrl}</a></p>
    <p style="margin:0 0 8px;font-size:13px;color:#525252;">Temporary password</p>
    <p style="margin:0;font-size:16px;font-weight:600;font-family:ui-monospace,monospace;">${temporaryPassword}</p>
  </div>
  <p><a href="${signInUrl}" style="display:inline-block;background:#171717;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:500;">Sign in to Pryrox</a></p>
  <p style="margin-top:32px;font-size:12px;color:#666;">If you weren't expecting this invitation, you can ignore this email.</p>
  <p style="font-size:12px;color:#666;">— Pryrox</p>
</body>
</html>`;
}

export function staffInviteEmailText(options: {
  fullName: string;
  pharmacyName: string;
  role: string;
  signInUrl: string;
  temporaryPassword: string;
}): string {
  const roleLabel = options.role === "pharmacist" ? "Pharmacist" : "Staff";
  return [
    `Hi ${options.fullName},`,
    ``,
    `You've been invited to ${options.pharmacyName} on Pryrox as ${roleLabel}.`,
    ``,
    `Sign in: ${options.signInUrl}`,
    `Temporary password: ${options.temporaryPassword}`,
    ``,
    `Change your password after your first login.`,
    ``,
    `— Pryrox`,
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
  const subject = `You're invited to ${options.pharmacyName} on Pryrox`;

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
        roleLabel: options.role === "pharmacist" ? "Pharmacist" : "Staff",
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
