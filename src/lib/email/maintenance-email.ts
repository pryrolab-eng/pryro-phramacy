import {
  emailHighlightBox,
  emailParagraph,
  escapeHtml,
  pryroxEmailLayout,
} from "./layout";

function formatMaintenanceDate(scheduledAt: string): string {
  const date = new Date(scheduledAt);
  return date.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function maintenanceNoticeEmailHtml(options: {
  message: string;
  scheduledAt: string;
}): string {
  const formatted = formatMaintenanceDate(options.scheduledAt);

  return pryroxEmailLayout({
    title: "Scheduled maintenance",
    preheader: `Pryrox maintenance planned for ${formatted}.`,
    footerNote:
      "We'll notify you when maintenance is complete. Thank you for your patience.",
    bodyHtml: [
      emailParagraph(
        "We're writing to let you know that Pryrox will undergo scheduled maintenance. During this window, you may experience limited or no access to the platform.",
      ),
      emailHighlightBox(
        [
          `<strong style="display:block;margin-bottom:6px;color:#0f172a;">When</strong>`,
          escapeHtml(formatted),
          `<strong style="display:block;margin:14px 0 6px;color:#0f172a;">What to expect</strong>`,
          escapeHtml(options.message),
        ].join(""),
      ),
      emailParagraph(
        "Please save any in-progress work before the maintenance window begins. We'll work to restore full service as quickly as possible.",
      ),
    ].join(""),
  });
}

export function maintenanceNoticeEmailText(options: {
  message: string;
  scheduledAt: string;
}): string {
  const formatted = formatMaintenanceDate(options.scheduledAt);
  return [
    "Scheduled maintenance",
    "",
    `When: ${formatted}`,
    `What to expect: ${options.message}`,
    "",
    "You may experience limited access during this time. Please save your work beforehand.",
    "",
    "— Pryrox",
  ].join("\n");
}
