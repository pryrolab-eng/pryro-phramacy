import { PRYROX_BRAND_BLUE, PRYROX_BRAND_BLUE_LIGHT } from "@/lib/brand/colors";
import { getAppUrl } from "@/lib/app-url";

const BRAND = PRYROX_BRAND_BLUE;
const BRAND_LIGHT = PRYROX_BRAND_BLUE_LIGHT;

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export type EmailLayoutOptions = {
  title: string;
  bodyHtml: string;
  preheader?: string;
  footerNote?: string;
};

export function pryroxEmailLayout(options: EmailLayoutOptions): string {
  const title = escapeHtml(options.title);
  const preheader = options.preheader
    ? escapeHtml(options.preheader)
    : escapeHtml(options.title);
  const footerNote =
    options.footerNote ??
    "If you did not request this email, you can safely ignore it.";
  const appUrl = getAppUrl();

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .email-body-cell { padding: 28px 20px !important; }
      .email-button { display: block !important; width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:${FONT_STACK};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f8;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="padding:0 0 20px;text-align:center;">
              <a href="${escapeHtml(appUrl)}" style="text-decoration:none;display:inline-block;">
                <span style="font-size:22px;font-weight:700;letter-spacing:-0.02em;color:${BRAND};">Pryrox</span>
              </a>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
                <tr>
                  <td style="height:4px;background:linear-gradient(90deg, ${BRAND} 0%, ${BRAND_LIGHT} 100%);font-size:0;line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td class="email-body-cell" style="padding:36px 40px 32px;">
                    <h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;font-weight:700;color:#0f172a;letter-spacing:-0.02em;">${title}</h1>
                    <div style="font-size:15px;line-height:1.65;color:#334155;">
                      ${options.bodyHtml}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 8px 0;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#64748b;">${escapeHtml(footerNote)}</p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;">
                &copy; ${new Date().getFullYear()} Pryrox &middot;
                <a href="${escapeHtml(appUrl)}" style="color:#64748b;text-decoration:underline;">${escapeHtml(appUrl.replace(/^https?:\/\//, ""))}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function emailParagraph(text: string): string {
  return `<p style="margin:0 0 16px;">${text}</p>`;
}

export function emailButton(label: string, href: string): string {
  const safeLabel = escapeHtml(label);
  const safeHref = escapeHtml(href);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr>
      <td>
        <a class="email-button" href="${safeHref}" style="display:inline-block;background-color:${BRAND};color:#ffffff;font-size:15px;font-weight:600;line-height:1;text-decoration:none;padding:14px 28px;border-radius:8px;mso-padding-alt:0;">
          <!--[if mso]><i style="letter-spacing:28px;mso-font-width:-100%;mso-text-raise:30pt">&nbsp;</i><![endif]-->
          <span style="mso-text-raise:15pt;">${safeLabel}</span>
          <!--[if mso]><i style="letter-spacing:28px;mso-font-width:-100%">&nbsp;</i><![endif]-->
        </a>
      </td>
    </tr>
  </table>`;
}

export function emailFallbackLink(href: string): string {
  const safeHref = escapeHtml(href);
  return `<p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#64748b;">
    Or copy and paste this link into your browser:<br />
    <a href="${safeHref}" style="color:${BRAND};word-break:break-all;text-decoration:underline;">${safeHref}</a>
  </p>`;
}

export type EmailDetailRow = { label: string; value: string; emphasize?: boolean };

export function emailDetailTable(rows: EmailDetailRow[]): string {
  const body = rows
    .map((row, index) => {
      const border =
        index < rows.length - 1 ? "border-bottom:1px solid #f1f5f9;" : "";
      const valueWeight = row.emphasize ? "font-weight:600;color:#0f172a;" : "color:#0f172a;";
      return `<tr>
        <td style="padding:12px 0;${border}font-size:14px;color:#64748b;width:40%;vertical-align:top;">${escapeHtml(row.label)}</td>
        <td style="padding:12px 0;${border}font-size:14px;${valueWeight}text-align:right;vertical-align:top;">${escapeHtml(row.value)}</td>
      </tr>`;
    })
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
    <tr>
      <td style="padding:4px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${body}</table>
      </td>
    </tr>
  </table>`;
}

export function emailCredentialsCard(options: {
  signInUrl: string;
  temporaryPassword: string;
}): string {
  const safeUrl = escapeHtml(options.signInUrl);
  const safePassword = escapeHtml(options.temporaryPassword);

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
    <tr>
      <td style="padding:20px;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#64748b;">Sign-in URL</p>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.5;word-break:break-all;">
          <a href="${safeUrl}" style="color:${BRAND};text-decoration:underline;">${safeUrl}</a>
        </p>
        <p style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#64748b;">Temporary password</p>
        <p style="margin:0;font-size:18px;font-weight:700;font-family:ui-monospace,'SFMono-Regular',Menlo,Consolas,monospace;letter-spacing:0.06em;color:#0f172a;background-color:#ffffff;border:1px dashed #cbd5e1;border-radius:6px;padding:10px 12px;display:inline-block;">${safePassword}</p>
      </td>
    </tr>
  </table>`;
}

export function emailHighlightBox(contentHtml: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;">
    <tr>
      <td style="padding:16px 18px;font-size:14px;line-height:1.6;color:#1e3a5f;">${contentHtml}</td>
    </tr>
  </table>`;
}
