import { emailParagraph, escapeHtml, pryroxEmailLayout } from "./layout";

export function adminNoticeEmailHtml(options: {
  title: string;
  message: string;
}): string {
  return pryroxEmailLayout({
    title: options.title,
    preheader: options.message.slice(0, 120),
    footerNote:
      "You received this because you have a Pryrox account. Administrative notices are sent infrequently.",
    bodyHtml: emailParagraph(escapeHtml(options.message)),
  });
}

export function adminNoticeEmailText(options: {
  title: string;
  message: string;
}): string {
  return [options.title, "", options.message, "", "— Pryrox"].join("\n");
}
