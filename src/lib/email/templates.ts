import {
  emailButton,
  emailFallbackLink,
  emailParagraph,
  pryroxEmailLayout,
} from "./layout";

/** @deprecated Use pryroxEmailLayout — kept for callers that still import authEmailLayout */
export function authEmailLayout(title: string, bodyHtml: string): string {
  return pryroxEmailLayout({ title, bodyHtml });
}

export function confirmationEmailHtml(link: string): string {
  return pryroxEmailLayout({
    title: "Confirm your email",
    preheader: "One click to finish setting up your Pryrox account.",
    bodyHtml: [
      emailParagraph(
        "Thanks for signing up. Confirm your email address to activate your Pryrox account and continue setup.",
      ),
      emailButton("Confirm email address", link),
      emailFallbackLink(link),
      emailParagraph(
        '<span style="font-size:13px;color:#64748b;">This link expires in 24 hours for your security.</span>',
      ),
    ].join(""),
  });
}

export function recoveryEmailHtml(link: string): string {
  return pryroxEmailLayout({
    title: "Reset your password",
    preheader: "Use the link below to choose a new Pryrox password.",
    bodyHtml: [
      emailParagraph(
        "We received a request to reset the password for your Pryrox account. Click the button below to choose a new password.",
      ),
      emailButton("Reset password", link),
      emailFallbackLink(link),
      emailParagraph(
        '<span style="font-size:13px;color:#64748b;">This link expires after a short time. If you did not request a reset, no action is needed.</span>',
      ),
    ].join(""),
  });
}
