// ─────────────────────────────────────────────────────────────
// Subscription lifecycle email templates + send helpers
// ─────────────────────────────────────────────────────────────

import { isSmtpConfigured, sendMail, sendMailWithReplyTo } from './mailer'

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

// ─── Template: Staff member welcome ─────────────────────

export function staffWelcomeEmailHtml(opts: {
  staffName: string
  pharmacyName: string
  email: string
  password: string
  role: string
  ownerName: string
  loginUrl: string
}): string {
  const roleLabel = opts.role.charAt(0).toUpperCase() + opts.role.slice(1)
  const body = `
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;font-weight:700;">Welcome to ${opts.pharmacyName}, ${opts.staffName || 'Team Member'}!</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:15px;">
      You have been added as a <strong>${roleLabel}</strong> at <strong>${opts.pharmacyName}</strong>.
      Below are your login credentials to access the pharmacy management system.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:0;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 14px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Your Login Credentials</p>
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:14px;width:90px;">Email</td>
              <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1e293b;">${opts.email}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:14px;">Password</td>
              <td style="padding:6px 0;">
                <code style="background:#e2e8f0;padding:3px 10px;border-radius:5px;font-size:14px;font-weight:700;color:#1e293b;letter-spacing:1px;">${opts.password}</code>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:14px;">Role</td>
              <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1e293b;">${roleLabel}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${alertBox('🔒 For your security, please change your password immediately after your first login.', 'amber')}

    <p style="color:#475569;font-size:14px;line-height:1.6;margin-top:20px;">
      You can sign in to access the pharmacy dashboard, process sales, manage inventory, and more — depending on your role.
    </p>
    ${btn('Sign In Now →', opts.loginUrl)}
    <p style="margin-top:24px;color:#94a3b8;font-size:12px;">
      This email was sent by <strong>${opts.ownerName}</strong> via the Pryrox Pharmacy Platform.
      If you have questions, reply to this email or contact your pharmacy manager directly.
    </p>
  `
  return layout(`Welcome to ${opts.pharmacyName} — Your account is ready`, body)
}

// ─── Send helper: staff welcome ───────────────────────────

export async function sendStaffWelcomeEmail(opts: {
  to: string
  staffName: string
  pharmacyName: string
  password: string
  role: string
  ownerName: string
  ownerEmail: string
}): Promise<boolean> {
  if (!isSmtpConfigured()) {
    console.warn('[sendStaffWelcomeEmail] SMTP not configured — skipping email')
    return false
  }
  const loginUrl = `${BASE_URL}/sign-in`
  try {
    await sendMailWithReplyTo({
      to: opts.to,
      replyTo: opts.ownerEmail,
      subject: `🏥 Welcome to ${opts.pharmacyName} — Your account credentials`,
      html: staffWelcomeEmailHtml({
        staffName: opts.staffName,
        pharmacyName: opts.pharmacyName,
        email: opts.to,
        password: opts.password,
        role: opts.role,
        ownerName: opts.ownerName,
        loginUrl,
      }),
      text: `Welcome to ${opts.pharmacyName}!\n\nYou have been added as ${opts.role}.\n\nEmail: ${opts.to}\nPassword: ${opts.password}\n\nSign in at: ${loginUrl}\n\nPlease change your password after first login.\n\n— ${opts.ownerName}`,
    })
    console.log(`[sendStaffWelcomeEmail] Email sent to ${opts.to}`)
    return true
  } catch (err) {
    console.error('[sendStaffWelcomeEmail] Failed to send email:', err)
    return false
  }
}

export function pharmacyOwnerWelcomeEmailHtml(opts: {
  ownerName: string
  pharmacyName: string
  email: string
  password: string
  loginUrl: string
}): string {
  const body = `
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;font-weight:700;">Welcome to Pryrox, ${opts.ownerName || 'Pharmacy Owner'}!</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:15px;">
      Your pharmacy <strong>${opts.pharmacyName}</strong> has been registered on the Pryrox platform.
      Here are your login credentials — please keep them safe.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:0;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 14px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Your Login Credentials</p>
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:14px;width:90px;">Email</td>
              <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1e293b;">${opts.email}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:14px;">Password</td>
              <td style="padding:6px 0;">
                <code style="background:#e2e8f0;padding:3px 10px;border-radius:5px;font-size:14px;font-weight:700;color:#1e293b;letter-spacing:1px;">${opts.password}</code>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${alertBox('🔒 For your security, please change your password immediately after your first login.', 'amber')}

    <p style="color:#475569;font-size:14px;line-height:1.6;margin-top:20px;">
      You can now sign in to manage your pharmacy, view inventory, process sales, and more.
    </p>
    ${btn('Sign In to Pryrox →', opts.loginUrl)}
    <p style="margin-top:20px;color:#94a3b8;font-size:12px;">
      If you have any questions, contact your platform administrator.
    </p>
  `
  return layout(`Welcome to Pryrox — ${opts.pharmacyName}`, body)
}

// ─── Send helper: pharmacy owner welcome ─────────────────

export async function sendPharmacyOwnerWelcomeEmail(opts: {
  to: string
  ownerName: string
  pharmacyName: string
  password: string
}): Promise<boolean> {
  if (!isSmtpConfigured()) {
    console.warn('[sendPharmacyOwnerWelcomeEmail] SMTP not configured — skipping email')
    return false
  }
  const loginUrl = `${BASE_URL}/sign-in`
  try {
    await sendMail({
      to: opts.to,
      subject: `🏥 Welcome to Pryrox — Your pharmacy account is ready`,
      html: pharmacyOwnerWelcomeEmailHtml({
        ownerName: opts.ownerName,
        pharmacyName: opts.pharmacyName,
        email: opts.to,
        password: opts.password,
        loginUrl,
      }),
      text: `Welcome to Pryrox! Your pharmacy "${opts.pharmacyName}" is ready.\n\nEmail: ${opts.to}\nPassword: ${opts.password}\n\nSign in at: ${loginUrl}\n\nPlease change your password after first login.`,
    })
    console.log(`[sendPharmacyOwnerWelcomeEmail] Email sent to ${opts.to}`)
    return true
  } catch (err) {
    console.error('[sendPharmacyOwnerWelcomeEmail] Failed to send email:', err)
    return false
  }
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
