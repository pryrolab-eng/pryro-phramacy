import nodemailer from "nodemailer";
import type Transporter from "nodemailer/lib/mailer";

let transporter: Transporter | null = null;

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim()
  );
}

function getTransporter(): Transporter {
  if (!isSmtpConfigured()) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env.local"
    );
  }

  // Always create a fresh transporter (avoids stale cached config after env changes)
  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure =
    process.env.SMTP_SECURE === "true" || String(port) === "465";

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

export function getDefaultFromAddress(): string {
  return (
    process.env.SMTP_FROM?.trim() ||
    `"Pryrox" <${process.env.SMTP_USER}>`
  );
}

export type SendMailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendMail(options: SendMailOptions): Promise<void> {
  const transport = getTransporter();
  await transport.sendMail({
    from: getDefaultFromAddress(),
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

export type SendMailWithReplyToOptions = SendMailOptions & {
  replyTo?: string;
};

export async function sendMailWithReplyTo(options: SendMailWithReplyToOptions): Promise<void> {
  const transport = getTransporter();
  await transport.sendMail({
    from: getDefaultFromAddress(),
    to: options.to,
    replyTo: options.replyTo,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}
