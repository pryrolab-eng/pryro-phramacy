// ─────────────────────────────────────────────────────────────
// Subscription lifecycle email templates + send helpers
// ─────────────────────────────────────────────────────────────

import { isSmtpConfigured, sendMail } from './mailer'

// ─── Shared layout ────────────────────────────────────────

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#1d4ed8;padding:28px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Pryrox Pharmacy</h1>
              <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Pharmacy Management Platform</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
                © ${new Date().getFullYear()} Pryrox Pharmacy Platform · You're receiving this because you manage a pharmacy on our platform.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function btn(text: string, url: string, color = '#1d4ed8'): string {
  return `<a href="${url}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;margin-top:20px;">${text}</a>`
}

function alertBox(text: string, color: 'red' | 'amber' | 'blue' | 'green'): string {
  const map = {
    red:   { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' },
    amber: { bg: '#fffbeb', border: '#fcd34d', text: '#92400e' },
    blue:  { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af' },
    green: { bg: '#f0fdf4', border: '#86efac', text: '#166534' },
  }
  const c = map[color]
  return `<div style="background:${c.bg};border:1px solid ${c.border};border-radius:8px;padding:16px 20px;margin:20px 0;">
    <p style="margin:0;color:${c.text};font-size:14px;font-weight:500;">${text}</p>
  </div>`
}

// ─── Template: Trial ending ───────────────────────────────

export function trialEndingEmailHtml(opts: {
  pharmacyName: string
  daysLeft: number
  planName: string
  billingUrl: string
}): string {
  const body = `
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;font-weight:700;">Your free trial ends in ${opts.daysLeft} day${opts.daysLeft !== 1 ? 's' : ''}</h2>
    <p style="margin:0 0 16px;color:#64748b;font-size:15px;">Hi <strong>${opts.pharmacyName}</strong>,</p>
    ${alertBox(`⏰ Your free trial expires in <strong>${opts.daysLeft} day${opts.daysLeft !== 1 ? 's' : ''}</strong>. Upgrade now to keep full access.`, 'amber')}
    <p style="color:#475569;font-size:14px;line-height:1.6;">
      After your trial ends, your pharmacy will be suspended and staff will lose access to POS, inventory, and all other features.
      Upgrade to a paid plan to continue without interruption.
    </p>
    <p style="color:#475569;font-size:14px;line-height:1.6;">
      Your current plan: <strong>${opts.planName}</strong>
    </p>
    ${btn('Upgrade Now →', opts.billingUrl)}
  `
  return layout(`Trial ending — ${opts.pharmacyName}`, body)
}

// ─── Template: Subscription expiring soon ────────────────

export function subscriptionExpiringSoonEmailHtml(opts: {
  pharmacyName: string
  daysLeft: number
  planName: string
  expiryDate: string
  billingUrl: string
}): string {
  const urgency = opts.daysLeft <= 1 ? 'red' : opts.daysLeft <= 3 ? 'amber' : 'blue'
  const body = `
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;font-weight:700;">Subscription expiring in ${opts.daysLeft} day${opts.daysLeft !== 1 ? 's' : ''}</h2>
    <p style="margin:0 0 16px;color:#64748b;font-size:15px;">Hi <strong>${opts.pharmacyName}</strong>,</p>
    ${alertBox(`⚠️ Your <strong>${opts.planName}</strong> subscription expires on <strong>${opts.expiryDate}</strong>.`, urgency as 'red' | 'amber' | 'blue' | 'green')}
    <p style="color:#475569;font-size:14px;line-height:1.6;">
      Renew before the expiry date to avoid any interruption to your pharmacy operations.
      Once expired, all staff will lose access until the subscription is renewed.
    </p>
    ${btn('Renew Subscription →', opts.billingUrl)}
  `
  return layout(`Subscription expiring — ${opts.pharmacyName}`, body)
}

// ─── Template: Subscription expired ─────────────────────

export function subscriptionExpiredEmailHtml(opts: {
  pharmacyName: string
  planName: string
  billingUrl: string
}): string {
  const body = `
    <h2 style="margin:0 0 8px;color:#dc2626;font-size:20px;font-weight:700;">Your subscription has expired</h2>
    <p style="margin:0 0 16px;color:#64748b;font-size:15px;">Hi <strong>${opts.pharmacyName}</strong>,</p>
    ${alertBox('🚫 Your subscription has expired. Your pharmacy is now suspended and staff cannot access the system.', 'red')}
    <p style="color:#475569;font-size:14px;line-height:1.6;">
      To restore access immediately, renew your <strong>${opts.planName}</strong> plan or upgrade to a higher tier.
      All your data is safe and will be available as soon as you reactivate.
    </p>
    ${btn('Reactivate Now →', opts.billingUrl, '#dc2626')}
  `
  return layout(`Subscription expired — ${opts.pharmacyName}`, body)
}

// ─── Template: Subscription activated / renewed ──────────

export function subscriptionActivatedEmailHtml(opts: {
  pharmacyName: string
  planName: string
  periodEnd: string
  billingUrl: string
  isRenewal?: boolean
}): string {
  const title = opts.isRenewal ? 'Subscription renewed' : 'Subscription activated'
  const body = `
    <h2 style="margin:0 0 8px;color:#166534;font-size:20px;font-weight:700;">${opts.isRenewal ? '🔄 Subscription Renewed' : '✅ Subscription Activated'}</h2>
    <p style="margin:0 0 16px;color:#64748b;font-size:15px;">Hi <strong>${opts.pharmacyName}</strong>,</p>
    ${alertBox(`Your <strong>${opts.planName}</strong> plan is now active until <strong>${opts.periodEnd}</strong>.`, 'green')}
    <p style="color:#475569;font-size:14px;line-height:1.6;">
      All features included in your plan are now available. Your team can access the system immediately.
    </p>
    ${btn('Go to Dashboard →', opts.billingUrl, '#16a34a')}
  `
  return layout(`${title} — ${opts.pharmacyName}`, body)
}

// ─── Template: Usage warning ─────────────────────────────

export function usageWarningEmailHtml(opts: {
  pharmacyName: string
  branchName: string
  txCount: number
  txLimit: number
  pct: number
  billingUrl: string
}): string {
  const isBlocked = opts.pct >= 100
  const color = isBlocked ? 'red' : opts.pct >= 90 ? 'amber' : 'blue'
  const headline = isBlocked
    ? '🚫 Transaction limit reached — branch blocked'
    : `⚠️ Transaction usage at ${opts.pct}%`

  const body = `
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;font-weight:700;">${headline}</h2>
    <p style="margin:0 0 16px;color:#64748b;font-size:15px;">Hi <strong>${opts.pharmacyName}</strong>,</p>
    ${alertBox(
      isBlocked
        ? `Branch <strong>${opts.branchName}</strong> has reached its monthly transaction limit (${opts.txCount.toLocaleString()} / ${opts.txLimit.toLocaleString()}). New sales are blocked until the limit resets or you upgrade.`
        : `Branch <strong>${opts.branchName}</strong> has used <strong>${opts.txCount.toLocaleString()} of ${opts.txLimit.toLocaleString()}</strong> transactions this month (${opts.pct}%).`,
      color as 'red' | 'amber' | 'blue' | 'green'
    )}
    <p style="color:#475569;font-size:14px;line-height:1.6;">
      Upgrade your plan to increase the monthly transaction limit and avoid disruptions.
    </p>
    ${btn('Upgrade Plan →', opts.billingUrl)}
  `
  return layout(`Usage warning — ${opts.pharmacyName}`, body)
}

// ─── Template: Subscription suspended by admin ───────────

export function subscriptionSuspendedEmailHtml(opts: {
  pharmacyName: string
  reason?: string
  billingUrl: string
}): string {
  const body = `
    <h2 style="margin:0 0 8px;color:#dc2626;font-size:20px;font-weight:700;">Your subscription has been suspended</h2>
    <p style="margin:0 0 16px;color:#64748b;font-size:15px;">Hi <strong>${opts.pharmacyName}</strong>,</p>
    ${alertBox(`Your pharmacy subscription has been suspended${opts.reason ? `: ${opts.reason}` : '.'}`, 'red')}
    <p style="color:#475569;font-size:14px;line-height:1.6;">
      Please contact support or visit your billing page to resolve this issue and restore access.
    </p>
    ${btn('View Billing →', opts.billingUrl, '#dc2626')}
  `
  return layout(`Subscription suspended — ${opts.pharmacyName}`, body)
}

// ─── Send helpers ─────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const BILLING_URL = `${BASE_URL}/pharmacy-dashboard/billing`

export async function sendTrialEndingEmail(opts: {
  to: string
  pharmacyName: string
  daysLeft: number
  planName: string
}): Promise<boolean> {
  if (!isSmtpConfigured()) return false
  try {
    await sendMail({
      to: opts.to,
      subject: `⏰ Your Pryrox trial ends in ${opts.daysLeft} day${opts.daysLeft !== 1 ? 's' : ''}`,
      html: trialEndingEmailHtml({ ...opts, billingUrl: BILLING_URL }),
      text: `Your free trial for ${opts.pharmacyName} ends in ${opts.daysLeft} days. Visit ${BILLING_URL} to upgrade.`,
    })
    return true
  } catch { return false }
}

export async function sendSubscriptionExpiringSoonEmail(opts: {
  to: string
  pharmacyName: string
  daysLeft: number
  planName: string
  expiryDate: string
}): Promise<boolean> {
  if (!isSmtpConfigured()) return false
  try {
    await sendMail({
      to: opts.to,
      subject: `⚠️ Pryrox subscription expires in ${opts.daysLeft} day${opts.daysLeft !== 1 ? 's' : ''}`,
      html: subscriptionExpiringSoonEmailHtml({ ...opts, billingUrl: BILLING_URL }),
      text: `Your ${opts.planName} subscription for ${opts.pharmacyName} expires on ${opts.expiryDate}. Renew at ${BILLING_URL}.`,
    })
    return true
  } catch { return false }
}

export async function sendSubscriptionExpiredEmail(opts: {
  to: string
  pharmacyName: string
  planName: string
}): Promise<boolean> {
  if (!isSmtpConfigured()) return false
  try {
    await sendMail({
      to: opts.to,
      subject: `🚫 Your Pryrox subscription has expired`,
      html: subscriptionExpiredEmailHtml({ ...opts, billingUrl: BILLING_URL }),
      text: `Your ${opts.planName} subscription for ${opts.pharmacyName} has expired. Reactivate at ${BILLING_URL}.`,
    })
    return true
  } catch { return false }
}

export async function sendSubscriptionActivatedEmail(opts: {
  to: string
  pharmacyName: string
  planName: string
  periodEnd: string
  isRenewal?: boolean
}): Promise<boolean> {
  if (!isSmtpConfigured()) return false
  try {
    await sendMail({
      to: opts.to,
      subject: opts.isRenewal
        ? `✅ Pryrox subscription renewed — ${opts.planName}`
        : `✅ Welcome to Pryrox ${opts.planName}`,
      html: subscriptionActivatedEmailHtml({ ...opts, billingUrl: BILLING_URL }),
      text: `Your ${opts.planName} subscription for ${opts.pharmacyName} is now active until ${opts.periodEnd}.`,
    })
    return true
  } catch { return false }
}

export async function sendUsageWarningEmail(opts: {
  to: string
  pharmacyName: string
  branchName: string
  txCount: number
  txLimit: number
  pct: number
}): Promise<boolean> {
  if (!isSmtpConfigured()) return false
  const subject = opts.pct >= 100
    ? `🚫 Transaction limit reached — ${opts.branchName}`
    : `⚠️ Transaction usage at ${opts.pct}% — ${opts.branchName}`
  try {
    await sendMail({
      to: opts.to,
      subject,
      html: usageWarningEmailHtml({ ...opts, billingUrl: BILLING_URL }),
      text: `Branch ${opts.branchName} has used ${opts.txCount}/${opts.txLimit} transactions (${opts.pct}%). Upgrade at ${BILLING_URL}.`,
    })
    return true
  } catch { return false }
}

export async function sendSubscriptionSuspendedEmail(opts: {
  to: string
  pharmacyName: string
  reason?: string
}): Promise<boolean> {
  if (!isSmtpConfigured()) return false
  try {
    await sendMail({
      to: opts.to,
      subject: `🚫 Your Pryrox subscription has been suspended`,
      html: subscriptionSuspendedEmailHtml({ ...opts, billingUrl: BILLING_URL }),
      text: `Your subscription for ${opts.pharmacyName} has been suspended. Visit ${BILLING_URL} for details.`,
    })
    return true
  } catch { return false }
}
