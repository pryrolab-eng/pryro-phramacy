export function authEmailLayout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#111;max-width:520px;margin:0 auto;padding:24px;">
  <h1 style="font-size:20px;margin:0 0 16px;">${title}</h1>
  ${bodyHtml}
  <p style="margin-top:32px;font-size:12px;color:#666;">If you did not request this, you can ignore this email.</p>
  <p style="font-size:12px;color:#666;">— Pryrox</p>
</body>
</html>`;
}

export function confirmationEmailHtml(link: string): string {
  return authEmailLayout(
    "Confirm your email",
    `<p>Thanks for signing up. Confirm your email to finish creating your Pryrox account.</p>
     <p><a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">Confirm email</a></p>
     <p style="font-size:13px;color:#666;word-break:break-all;">Or copy this link: ${link}</p>`
  );
}

export function recoveryEmailHtml(link: string): string {
  return authEmailLayout(
    "Reset your password",
    `<p>We received a request to reset your Pryrox password.</p>
     <p><a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">Reset password</a></p>
     <p style="font-size:13px;color:#666;word-break:break-all;">Or copy this link: ${link}</p>
     <p style="font-size:13px;color:#666;">This link expires after a short time.</p>`
  );
}
