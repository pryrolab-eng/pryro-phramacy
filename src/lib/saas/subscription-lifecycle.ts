// ─────────────────────────────────────────────────────────────
// Subscription Lifecycle Engine
// Handles: expiry detection, auto-suspend, usage warnings,
//          cron-style jobs, and email notifications.
// Call only from server-side / API routes (uses service client).
// ─────────────────────────────────────────────────────────────

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  sendTrialEndingEmail,
  sendSubscriptionExpiringSoonEmail,
  sendSubscriptionExpiredEmail,
  sendSubscriptionActivatedEmail,
  sendUsageWarningEmail,
  sendSubscriptionSuspendedEmail,
} from '@/lib/email/subscription-emails'

// ─── Types ────────────────────────────────────────────────

export interface LifecycleResult {
  processed: number
  suspended: number
  emailsSent: number
  errors: string[]
}

// ─── Helper: get pharmacy owner email ────────────────────

async function getPharmacyOwnerEmail(
  admin: SupabaseClient,
  pharmacyId: string
): Promise<{ email: string; pharmacyName: string } | null> {
  const { data } = await admin
    .from('pharmacies')
    .select(`
      name,
      pharmacy_users!inner(
        user_id,
        role,
        users:user_id(email)
      )
    `)
    .eq('id', pharmacyId)
    .eq('pharmacy_users.role', 'pharmacy_owner')
    .eq('pharmacy_users.is_active', true)
    .limit(1)
    .maybeSingle()

  if (!data) return null

  // Try pharmacy email first, then owner user email
  const { data: pharmacy } = await admin
    .from('pharmacies')
    .select('name, email')
    .eq('id', pharmacyId)
    .maybeSingle()

  const ownerEmail = (pharmacy?.email as string | null) ?? null

  if (!ownerEmail) return null
  return { email: ownerEmail, pharmacyName: pharmacy?.name ?? 'Your pharmacy' }
}

// ─── Job 1: Check and auto-suspend expired subscriptions ─

export async function runExpiryCheck(admin: SupabaseClient): Promise<LifecycleResult> {
  const result: LifecycleResult = { processed: 0, suspended: 0, emailsSent: 0, errors: [] }
  const now = new Date().toISOString()

  // Find active subscriptions that have passed their period end
  const { data: expired, error } = await admin
    .from('subscriptions')
    .select(`
      id, pharmacy_id, status, current_period_end, trial_ends_at,
      plan:subscription_plans(name)
    `)
    .eq('subscription_type', 'main')
    .eq('status', 'active')
    .lt('current_period_end', now)

  if (error) {
    result.errors.push(`Expiry query: ${error.message}`)
    return result
  }

  for (const sub of expired ?? []) {
    result.processed++
    try {
      // Mark subscription as expired
      await admin
        .from('subscriptions')
        .update({ status: 'expired', is_active: false })
        .eq('id', sub.id)

      // Suspend the pharmacy
      await admin
        .from('pharmacies')
        .update({ status: 'suspended' })
        .eq('id', sub.pharmacy_id)

      result.suspended++

      // Send expired email
      const contact = await getPharmacyOwnerEmail(admin, sub.pharmacy_id)
      if (contact) {
        const sent = await sendSubscriptionExpiredEmail({
          to: contact.email,
          pharmacyName: contact.pharmacyName,
          planName: (sub.plan as { name?: string } | null)?.name ?? 'Subscription',
        })
        if (sent) result.emailsSent++
      }
    } catch (e) {
      result.errors.push(`Sub ${sub.id}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return result
}

// ─── Job 2: Send expiry warning emails ───────────────────
// Sends at 7 days, 3 days, 1 day before expiry.
// Uses a notification_log table to avoid duplicate sends.

export async function runExpiryWarnings(admin: SupabaseClient): Promise<LifecycleResult> {
  const result: LifecycleResult = { processed: 0, suspended: 0, emailsSent: 0, errors: [] }

  const warningDays = [7, 3, 1]

  for (const days of warningDays) {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + days)
    const dayStart = new Date(targetDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(targetDate)
    dayEnd.setHours(23, 59, 59, 999)

    const { data: subs, error } = await admin
      .from('subscriptions')
      .select(`
        id, pharmacy_id, current_period_end, trial_ends_at, subscription_type,
        plan:subscription_plans(name)
      `)
      .eq('subscription_type', 'main')
      .eq('status', 'active')
      .gte('current_period_end', dayStart.toISOString())
      .lte('current_period_end', dayEnd.toISOString())

    if (error) {
      result.errors.push(`Warning query (${days}d): ${error.message}`)
      continue
    }

    for (const sub of subs ?? []) {
      result.processed++
      const notifKey = `expiry_warning_${days}d_${sub.id}`

      // Check if already sent
      const { data: existing } = await admin
        .from('subscription_notification_log')
        .select('id')
        .eq('key', notifKey)
        .maybeSingle()

      if (existing) continue

      try {
        const contact = await getPharmacyOwnerEmail(admin, sub.pharmacy_id)
        if (!contact) continue

        const expiryDate = new Date(sub.current_period_end).toLocaleDateString('en-RW', {
          dateStyle: 'medium',
        })

        const isTrial = (sub.plan as { name?: string } | null)?.name?.toLowerCase().includes('starter') ||
          (sub.plan as { name?: string } | null)?.name?.toLowerCase().includes('free') ||
          sub.trial_ends_at != null

        let sent = false
        if (isTrial) {
          sent = await sendTrialEndingEmail({
            to: contact.email,
            pharmacyName: contact.pharmacyName,
            daysLeft: days,
            planName: (sub.plan as { name?: string } | null)?.name ?? 'Free Trial',
          })
        } else {
          sent = await sendSubscriptionExpiringSoonEmail({
            to: contact.email,
            pharmacyName: contact.pharmacyName,
            daysLeft: days,
            planName: (sub.plan as { name?: string } | null)?.name ?? 'Subscription',
            expiryDate,
          })
        }

        if (sent) {
          result.emailsSent++
          // Log so we don't send again
          await admin
            .from('subscription_notification_log')
            .insert({ key: notifKey, pharmacy_id: sub.pharmacy_id, subscription_id: sub.id })
        }
      } catch (e) {
        result.errors.push(`Warning ${days}d sub ${sub.id}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
  }

  return result
}

// ─── Job 3: Reset monthly branch usage ───────────────────

export async function runMonthlyUsageReset(admin: SupabaseClient): Promise<{ reset: number; error?: string }> {
  const { data, error } = await admin.rpc('reset_monthly_branch_usage')
  if (error) return { reset: 0, error: error.message }
  return { reset: Number(data ?? 0) }
}

// ─── Job 4: Usage warnings (75%, 90%, 100%) ──────────────

export async function runUsageWarnings(admin: SupabaseClient): Promise<LifecycleResult> {
  const result: LifecycleResult = { processed: 0, suspended: 0, emailsSent: 0, errors: [] }
  const today = new Date().toISOString().split('T')[0]

  // Get all active branch_usage records for current cycle
  const { data: usageRows, error } = await admin
    .from('branch_usage')
    .select(`
      id, branch_id, pharmacy_id, tx_count, tx_limit, is_blocked,
      branch:branches(name)
    `)
    .lte('billing_cycle_start', today)
    .gte('billing_cycle_end', today)
    .gt('tx_limit', 0)

  if (error) {
    result.errors.push(`Usage query: ${error.message}`)
    return result
  }

  for (const row of usageRows ?? []) {
    result.processed++
    const pct = Math.round((row.tx_count / row.tx_limit) * 100)

    // Only warn at 75, 90, 100
    const threshold = pct >= 100 ? 100 : pct >= 90 ? 90 : pct >= 75 ? 75 : 0
    if (threshold === 0) continue

    const notifKey = `usage_warning_${threshold}pct_${row.id}_${today.slice(0, 7)}`

    const { data: existing } = await admin
      .from('subscription_notification_log')
      .select('id')
      .eq('key', notifKey)
      .maybeSingle()

    if (existing) continue

    try {
      const contact = await getPharmacyOwnerEmail(admin, row.pharmacy_id)
      if (!contact) continue

      const branchName = (row.branch as { name?: string } | null)?.name ?? 'Branch'

      const sent = await sendUsageWarningEmail({
        to: contact.email,
        pharmacyName: contact.pharmacyName,
        branchName,
        txCount: row.tx_count,
        txLimit: row.tx_limit,
        pct: threshold,
      })

      if (sent) {
        result.emailsSent++
        await admin
          .from('subscription_notification_log')
          .insert({ key: notifKey, pharmacy_id: row.pharmacy_id })
      }
    } catch (e) {
      result.errors.push(`Usage warning ${row.id}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return result
}

// ─── Admin: suspend a subscription ───────────────────────

export async function adminSuspendSubscription(
  admin: SupabaseClient,
  subscriptionId: string,
  reason?: string
): Promise<void> {
  const { data: sub, error } = await admin
    .from('subscriptions')
    .update({ status: 'cancelled', is_active: false, cancelled_at: new Date().toISOString() })
    .eq('id', subscriptionId)
    .select('pharmacy_id, plan:subscription_plans(name)')
    .single()

  if (error) throw new Error(`adminSuspendSubscription: ${error.message}`)

  // Suspend pharmacy
  await admin
    .from('pharmacies')
    .update({ status: 'suspended' })
    .eq('id', sub.pharmacy_id)

  // Send email
  const contact = await getPharmacyOwnerEmail(admin, sub.pharmacy_id)
  if (contact) {
    await sendSubscriptionSuspendedEmail({
      to: contact.email,
      pharmacyName: contact.pharmacyName,
      reason,
    })
  }
}

// ─── Admin: reactivate a subscription ────────────────────

export async function adminReactivateSubscription(
  admin: SupabaseClient,
  subscriptionId: string
): Promise<void> {
  // Get the subscription + plan
  const { data: sub, error } = await admin
    .from('subscriptions')
    .select('id, pharmacy_id, plan_id, plan:subscription_plans(name, monthly_tx_limit)')
    .eq('id', subscriptionId)
    .maybeSingle()

  if (error || !sub) throw new Error('Subscription not found')

  const plan = sub.plan as { name?: string; monthly_tx_limit?: number } | null
  const now = new Date()
  const end = new Date(now)
  end.setMonth(end.getMonth() + 1)

  // Reactivate subscription
  await admin
    .from('subscriptions')
    .update({
      status: 'active',
      is_active: true,
      cancelled_at: null,
      current_period_start: now.toISOString(),
      current_period_end: end.toISOString(),
    })
    .eq('id', subscriptionId)

  // Reactivate pharmacy
  await admin
    .from('pharmacies')
    .update({ status: 'active' })
    .eq('id', sub.pharmacy_id)

  // Re-provision usage for all active branches
  const { data: branches } = await admin
    .from('branches')
    .select('id')
    .eq('pharmacy_id', sub.pharmacy_id)
    .eq('is_active', true)

  for (const branch of branches ?? []) {
    await admin.rpc('provision_branch_usage', {
      p_branch_id: branch.id,
      p_pharmacy_id: sub.pharmacy_id,
      p_subscription_id: subscriptionId,
      p_tx_limit: plan?.monthly_tx_limit ?? 500,
    })
  }

  // Send reactivation email
  const contact = await getPharmacyOwnerEmail(admin, sub.pharmacy_id)
  if (contact) {
    await sendSubscriptionActivatedEmail({
      to: contact.email,
      pharmacyName: contact.pharmacyName,
      planName: plan?.name ?? 'Subscription',
      periodEnd: end.toLocaleDateString('en-RW', { dateStyle: 'medium' }),
      isRenewal: true,
    })
  }
}
