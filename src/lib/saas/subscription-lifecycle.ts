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
// Strategy (in order):
//   1. pharmacies.email  (set during onboarding)
//   2. auth.users.email of the pharmacy_owner member
//   3. auth.users.email of the owner_id on the pharmacy row

async function getPharmacyOwnerEmail(
  admin: SupabaseClient,
  pharmacyId: string
): Promise<{ email: string; pharmacyName: string } | null> {
  // Step 1: fetch pharmacy row — has email + owner_id + name
  const { data: pharmacy } = await admin
    .from('pharmacies')
    .select('id, name, email, owner_id')
    .eq('id', pharmacyId)
    .maybeSingle()

  if (!pharmacy) return null

  const pharmacyName: string = (pharmacy.name as string) ?? 'Your pharmacy'

  // Use pharmacy.email if present
  const directEmail = (pharmacy.email as string | null)?.trim()
  if (directEmail) return { email: directEmail, pharmacyName }

  // Step 2: find the pharmacy_owner member and get their auth email
  const { data: ownerMember } = await admin
    .from('pharmacy_users')
    .select('user_id')
    .eq('pharmacy_id', pharmacyId)
    .eq('role', 'pharmacy_owner')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  const ownerUserId: string | null =
    (ownerMember?.user_id as string | null) ??
    (pharmacy.owner_id as string | null) ??
    null

  if (!ownerUserId) return null

  // Step 3: look up the auth user's email via service role
  const { data: authUser } = await admin.auth.admin.getUserById(ownerUserId)
  const authEmail = authUser?.user?.email?.trim()
  if (authEmail) return { email: authEmail, pharmacyName }

  return null
}

// ─── Job 1: Check and auto-suspend expired subscriptions ─
// Respects grace_period_days from the plan before suspending.

export async function runExpiryCheck(admin: SupabaseClient): Promise<LifecycleResult> {
  const result: LifecycleResult = { processed: 0, suspended: 0, emailsSent: 0, errors: [] }
  const now = new Date().toISOString()

  // Find active subscriptions that have passed their period end
  const { data: expired, error } = await admin
    .from('subscriptions')
    .select(`
      id, pharmacy_id, status, current_period_end, trial_ends_at,
      plan:subscription_plans(name, grace_period_days)
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
      const graceDays = (sub.plan as { grace_period_days?: number } | null)?.grace_period_days ?? 3
      const periodEnd = new Date(sub.current_period_end)
      const graceEnd = new Date(periodEnd)
      graceEnd.setDate(graceEnd.getDate() + graceDays)

      // Still within grace period — mark as past_due but don't suspend yet
      if (new Date() < graceEnd) {
        await admin
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('id', sub.id)
        continue
      }

      // Grace period over — expire and suspend
      await admin
        .from('subscriptions')
        .update({ status: 'expired', is_active: false })
        .eq('id', sub.id)

      await admin
        .from('pharmacies')
        .update({ status: 'suspended' })
        .eq('id', sub.pharmacy_id)

      result.suspended++

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
