// ─────────────────────────────────────────────────────────────
// SaaS Subscription Engine
// All business logic for subscriptions, usage, and billing.
// Uses service-role client — call only from server-side code.
// ─────────────────────────────────────────────────────────────

import type { SupabaseClient } from '@supabase/supabase-js'
import { sendSubscriptionActivatedEmail } from '@/lib/email/subscription-emails'
import type {
  ActivateSubscriptionParams,
  Branch,
  BranchUsage,
  PharmacySubscriptionSummary,
  Subscription,
  SubscriptionInvoice,
  SubscriptionPlan,
  TransactionCheckResult,
} from './types'

// ─── Helpers ──────────────────────────────────────────────

function periodEnd(start: Date, billing_period: string): Date {
  const end = new Date(start)
  if (billing_period === 'yearly') {
    end.setFullYear(end.getFullYear() + 1)
  } else if (billing_period === 'free') {
    // Free/trial: 14 days (handled by onboarding, but fallback here)
    end.setDate(end.getDate() + 14)
  } else {
    // monthly
    end.setMonth(end.getMonth() + 1)
  }
  return end
}

function invoiceNumber(): string {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `SINV-${ymd}-${suffix}`
}

// ─── Plan queries ──────────────────────────────────────────

export async function getActivePlans(
  admin: SupabaseClient
): Promise<SubscriptionPlan[]> {
  const { data, error } = await admin
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true })

  if (error) throw new Error(`getActivePlans: ${error.message}`)
  return (data ?? []) as SubscriptionPlan[]
}

export async function getPlanById(
  admin: SupabaseClient,
  planId: string
): Promise<SubscriptionPlan | null> {
  const { data, error } = await admin
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .maybeSingle()

  if (error) throw new Error(`getPlanById: ${error.message}`)
  return data as SubscriptionPlan | null
}

// ─── Subscription queries ──────────────────────────────────

export async function getPharmacySubscriptions(
  admin: SupabaseClient,
  pharmacyId: string
): Promise<Subscription[]> {
  const { data, error } = await admin
    .from('subscriptions')
    .select('*, plan:subscription_plans!plan_id(*)')
    .eq('pharmacy_id', pharmacyId)
    .in('status', ['active', 'trialing', 'pending'])
    .order('created_at', { ascending: false })

  if (error) {
    // If the status column doesn't exist yet (pre-migration), fall back to is_active
    if (error.message.includes('status') || error.message.includes('column')) {
      const { data: fallback, error: fallbackErr } = await admin
        .from('subscriptions')
        .select('*, plan:subscription_plans!plan_id(*)')
        .eq('pharmacy_id', pharmacyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      if (fallbackErr) throw new Error(`getPharmacySubscriptions: ${fallbackErr.message}`)
      return (fallback ?? []) as Subscription[]
    }
    throw new Error(`getPharmacySubscriptions: ${error.message}`)
  }
  return (data ?? []) as Subscription[]
}

export async function getPharmacyMainSubscription(
  admin: SupabaseClient,
  pharmacyId: string
): Promise<Subscription | null> {
  const { data, error } = await admin
    .from('subscriptions')
    .select('*, plan:subscription_plans!plan_id(*)')
    .eq('pharmacy_id', pharmacyId)
    .eq('subscription_type', 'main')
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`getPharmacyMainSubscription: ${error.message}`)
  return data as Subscription | null
}

// ─── Branch queries ────────────────────────────────────────

export async function getPharmacyBranches(
  admin: SupabaseClient,
  pharmacyId: string
): Promise<Branch[]> {
  const { data, error } = await admin
    .from('branches')
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`getPharmacyBranches: ${error.message}`)
  return (data ?? []) as Branch[]
}

export async function getBranchCurrentUsage(
  admin: SupabaseClient,
  branchId: string
): Promise<BranchUsage | null> {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await admin
    .from('branch_usage')
    .select('*')
    .eq('branch_id', branchId)
    .lte('billing_cycle_start', today)
    .gte('billing_cycle_end', today)
    .order('billing_cycle_start', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`getBranchCurrentUsage: ${error.message}`)
  return data as BranchUsage | null
}

// ─── Full pharmacy subscription summary ───────────────────

export async function getPharmacySubscriptionSummary(
  admin: SupabaseClient,
  pharmacyId: string
): Promise<PharmacySubscriptionSummary> {
  // Run subscriptions + branches in parallel; treat errors as empty results
  const [subscriptions, branches] = await Promise.all([
    getPharmacySubscriptions(admin, pharmacyId).catch(() => [] as Subscription[]),
    getPharmacyBranches(admin, pharmacyId).catch(() => [] as Branch[]),
  ])

  const mainSub = subscriptions.find(s => s.subscription_type === 'main') ?? null
  const branchSubs = subscriptions.filter(s => s.subscription_type === 'branch_addon')

  // When there is no active subscription, limits are null (unknown/no plan)
  // rather than 0 — so the UI can distinguish "no plan" from "plan with 0 limit"
  const branchLimit = mainSub
    ? ((mainSub.plan as SubscriptionPlan | undefined)?.max_branches ?? 0)
    : null
  const userLimit = mainSub
    ? ((mainSub.plan as SubscriptionPlan | undefined)?.max_users ?? 0)
    : null
  const branchCount = branches.length

  // Fetch usage for all branches in parallel; swallow individual failures
  const branchesWithUsage = await Promise.all(
    branches.map(async (b) => {
      const usage = await getBranchCurrentUsage(admin, b.id).catch(() => null)
      return { ...b, usage }
    })
  )

  // Count active users for this pharmacy; default to 0 on error
  const userCount = await admin
    .from('pharmacy_users')
    .select('id', { count: 'exact', head: true })
    .eq('pharmacy_id', pharmacyId)
    .eq('is_active', true)
    .then(({ count }) => count ?? 0)
    .catch(() => 0)

  const totalMonthlyCost = subscriptions.reduce((sum, s) => {
    const plan = s.plan as SubscriptionPlan | undefined
    const billingPeriod = s.billing_period ?? 'monthly'
    // For yearly subscribers show the effective monthly cost (yearly_price / 12)
    if (billingPeriod === 'yearly' && plan?.yearly_price && Number(plan.yearly_price) > 0) {
      return sum + Math.round(Number(plan.yearly_price) / 12)
    }
    return sum + Number(plan?.price ?? 0)
  }, 0)

  return {
    pharmacy_id: pharmacyId,
    main_subscription: mainSub,
    branch_subscriptions: branchSubs,
    branches: branchesWithUsage,
    total_monthly_cost: totalMonthlyCost,
    branch_limit: branchLimit ?? 0,
    branch_count: branchCount,
    can_add_branch: branchLimit !== null && branchCount < branchLimit,
    user_count: userCount,
    user_limit: userLimit ?? 0,
  }
}

// ─── Activate subscription ─────────────────────────────────

export async function activateSubscription(
  admin: SupabaseClient,
  params: ActivateSubscriptionParams
): Promise<Subscription> {
  const plan = await getPlanById(admin, params.plan_id)
  if (!plan) throw new Error('Plan not found')
  if (!plan.is_active) throw new Error('Plan is not available')

  const now = new Date()
  const end = periodEnd(now, params.billing_period_override ?? plan.billing_period)

  // For main plans: deactivate any existing main subscription
  if (params.subscription_type === 'main') {
    await admin
      .from('subscriptions')
      .update({ status: 'cancelled', cancelled_at: now.toISOString() })
      .eq('pharmacy_id', params.pharmacy_id)
      .eq('subscription_type', 'main')
      .eq('status', 'active')
  }

  const effectiveBillingPeriod = params.billing_period_override ?? plan.billing_period

  const { data, error } = await admin
    .from('subscriptions')
    .insert({
      pharmacy_id: params.pharmacy_id,
      plan_id: params.plan_id,
      branch_id: params.branch_id ?? null,
      subscription_type: params.subscription_type,
      billing_period: effectiveBillingPeriod,
      status: 'active',
      is_active: true,
      plan: 'standard', // legacy enum — keep for backward compat
      current_period_start: now.toISOString(),
      current_period_end: end.toISOString(),
    })
    .select('*, plan:subscription_plans!plan_id(*)')
    .single()

  if (error) throw new Error(`activateSubscription: ${error.message}`)

  const sub = data as Subscription

  // Provision usage for all active branches (main plan) or specific branch (addon)
  if (params.subscription_type === 'main') {
    const branches = await getPharmacyBranches(admin, params.pharmacy_id)
    await Promise.all(
      branches.map(b =>
        admin.rpc('provision_branch_usage', {
          p_branch_id: b.id,
          p_pharmacy_id: params.pharmacy_id,
          p_subscription_id: sub.id,
          p_tx_limit: plan.monthly_tx_limit,
        })
      )
    )
    // Update pharmacy status
    await admin
      .from('pharmacies')
      .update({
        status: 'active',
        subscription_plan: plan.name.toLowerCase().includes('premium') ? 'premium' : 'standard',
        subscription_expires_at: end.toISOString(),
      })
      .eq('id', params.pharmacy_id)
  } else if (params.branch_id) {
    // Branch addon: provision usage for that specific branch
    await admin.rpc('provision_branch_usage', {
      p_branch_id: params.branch_id,
      p_pharmacy_id: params.pharmacy_id,
      p_subscription_id: sub.id,
      p_tx_limit: plan.monthly_tx_limit,
    })
  }

  // Send activation email (non-blocking)
  if (params.subscription_type === 'main') {
    try {
      // 3-step email fallback: pharmacies.email → pharmacy_owner member → owner_id auth user
      const { data: pharmacy } = await admin
        .from('pharmacies')
        .select('name, email, owner_id')
        .eq('id', params.pharmacy_id)
        .maybeSingle()

      let recipientEmail: string | null = (pharmacy?.email as string | null)?.trim() ?? null

      if (!recipientEmail) {
        // Try pharmacy_owner member
        const { data: ownerMember } = await admin
          .from('pharmacy_users')
          .select('user_id')
          .eq('pharmacy_id', params.pharmacy_id)
          .eq('role', 'pharmacy_owner')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle()

        const ownerUserId: string | null =
          (ownerMember?.user_id as string | null) ??
          (pharmacy?.owner_id as string | null) ??
          null

        if (ownerUserId) {
          const { data: authUser } = await admin.auth.admin.getUserById(ownerUserId)
          recipientEmail = authUser?.user?.email?.trim() ?? null
        }
      }

      if (recipientEmail) {
        void sendSubscriptionActivatedEmail({
          to: recipientEmail,
          pharmacyName: (pharmacy?.name as string) ?? 'Your pharmacy',
          planName: plan.name,
          periodEnd: end.toLocaleDateString('en-RW', { dateStyle: 'medium' }),
          isRenewal: false,
        })
      }
    } catch { /* non-fatal */ }
  }

  return sub
}

// ─── Cancel subscription ───────────────────────────────────

export async function cancelSubscription(
  admin: SupabaseClient,
  subscriptionId: string,
  pharmacyId: string
): Promise<void> {
  const { error } = await admin
    .from('subscriptions')
    .update({
      status: 'cancelled',
      is_active: false,
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', subscriptionId)
    .eq('pharmacy_id', pharmacyId)

  if (error) throw new Error(`cancelSubscription: ${error.message}`)
}

// ─── Transaction gate ──────────────────────────────────────

export async function checkBranchCanTransact(
  admin: SupabaseClient,
  branchId: string
): Promise<TransactionCheckResult> {
  const { data, error } = await admin.rpc('check_branch_can_transact', {
    p_branch_id: branchId,
  })

  if (error) throw new Error(`checkBranchCanTransact: ${error.message}`)

  const result = data as {
    allowed: boolean
    reason?: string
    tx_count?: number
    tx_limit?: number
    remaining?: number
    message?: string
  }

  return {
    allowed: result.allowed,
    reason: result.reason as TransactionCheckResult['reason'],
    tx_count: result.tx_count,
    tx_limit: result.tx_limit,
    remaining: result.remaining,
    message: result.message,
  }
}

export async function incrementBranchTx(
  admin: SupabaseClient,
  branchId: string
): Promise<{ ok: boolean; tx_count?: number; tx_limit?: number; remaining?: number; blocked?: boolean }> {
  const { data, error } = await admin.rpc('increment_branch_tx', {
    p_branch_id: branchId,
  })

  if (error) throw new Error(`incrementBranchTx: ${error.message}`)
  return data as { ok: boolean; tx_count?: number; tx_limit?: number; remaining?: number; blocked?: boolean }
}

// ─── Branch management ─────────────────────────────────────

export async function createBranch(
  admin: SupabaseClient,
  pharmacyId: string,
  data: { name: string; address?: string; phone?: string; email?: string }
): Promise<Branch> {
  // Check branch limit
  const mainSub = await getPharmacyMainSubscription(admin, pharmacyId)
  if (!mainSub) throw new Error('No active subscription. Please subscribe first.')

  const plan = mainSub.plan as SubscriptionPlan | undefined
  if (!plan) throw new Error('Subscription plan not found.')

  const branches = await getPharmacyBranches(admin, pharmacyId)

  // Count branches covered by main plan
  const mainPlanBranchCount = branches.length
  const addonSubs = await admin
    .from('subscriptions')
    .select('id')
    .eq('pharmacy_id', pharmacyId)
    .eq('subscription_type', 'branch_addon')
    .eq('status', 'active')

  const addonCount = (addonSubs.data ?? []).length
  const totalAllowed = plan.max_branches + addonCount

  if (mainPlanBranchCount >= totalAllowed) {
    throw new Error(
      `Branch limit reached (${totalAllowed} allowed). Upgrade your plan or add a Branch Add-on subscription.`
    )
  }

  const { data: branch, error } = await admin
    .from('branches')
    .insert({
      pharmacy_id: pharmacyId,
      name: data.name,
      address: data.address ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      is_active: true,
    })
    .select()
    .single()

  if (error) throw new Error(`createBranch: ${error.message}`)

  // Provision usage for the new branch under the main subscription
  await admin.rpc('provision_branch_usage', {
    p_branch_id: branch.id,
    p_pharmacy_id: pharmacyId,
    p_subscription_id: mainSub.id,
    p_tx_limit: plan.monthly_tx_limit,
  })

  return branch as Branch
}

// ─── Invoice generation ────────────────────────────────────

export async function generateMonthlyInvoice(
  admin: SupabaseClient,
  pharmacyId: string,
  billingMonth?: string // 'YYYY-MM', defaults to current month
): Promise<SubscriptionInvoice> {
  const month = billingMonth ?? new Date().toISOString().slice(0, 7)

  // Check if invoice already exists
  const { data: existing } = await admin
    .from('subscription_invoices')
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .eq('billing_month', month)
    .maybeSingle()

  if (existing) return existing as SubscriptionInvoice

  const subscriptions = await getPharmacySubscriptions(admin, pharmacyId)
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active')

  if (activeSubscriptions.length === 0) {
    throw new Error('No active subscriptions to invoice.')
  }

  const lines = activeSubscriptions.map(s => {
    const plan = s.plan as SubscriptionPlan | undefined
    const billingPeriod = s.billing_period ?? 'monthly'

    // For yearly subscribers: charge yearly_price / 12 per month
    // For monthly subscribers: charge the monthly price
    let amount: number
    if (billingPeriod === 'yearly' && plan?.yearly_price && plan.yearly_price > 0) {
      amount = Math.round(Number(plan.yearly_price) / 12)
    } else {
      amount = Number(plan?.price ?? 0)
    }

    const label = s.subscription_type === 'main'
      ? `${plan?.name ?? 'Plan'} — Main subscription (${billingPeriod})`
      : `${plan?.name ?? 'Branch Add-on'} — Branch subscription (${billingPeriod})`
    return {
      subscription_id: s.id,
      branch_id: s.branch_id,
      description: label,
      amount,
    }
  })

  const subtotal = lines.reduce((sum, l) => sum + l.amount, 0)
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 7) // due in 7 days

  const { data: invoice, error: invErr } = await admin
    .from('subscription_invoices')
    .insert({
      pharmacy_id: pharmacyId,
      invoice_number: invoiceNumber(),
      billing_month: month,
      subtotal,
      total: subtotal,
      status: 'pending',
      due_date: dueDate.toISOString().split('T')[0],
    })
    .select()
    .single()

  if (invErr) throw new Error(`generateMonthlyInvoice: ${invErr.message}`)

  // Insert line items
  const lineInserts = lines.map(l => ({ ...l, invoice_id: invoice.id }))
  await admin.from('subscription_invoice_lines').insert(lineInserts)

  return invoice as SubscriptionInvoice
}

// ─── Admin: get all subscriptions ─────────────────────────

export async function getAllSubscriptions(
  admin: SupabaseClient,
  opts?: { status?: string; limit?: number; offset?: number }
) {
  // Step 1: fetch subscriptions (base columns only — avoids 500 if newer
  // columns like billing_period / trial_ends_at haven't been migrated yet).
  let query = admin
    .from('subscriptions')
    .select(`
      id, pharmacy_id, plan_id,
      status, is_active, current_period_start, current_period_end,
      cancelled_at, created_at, updated_at
    `)
    .order('created_at', { ascending: false })

  if (opts?.status) query = query.eq('status', opts.status)
  if (opts?.limit) query = query.limit(opts.limit)
  if (opts?.offset) query = query.range(opts.offset, (opts.offset + (opts.limit ?? 20)) - 1)

  const { data: subs, error: subsErr } = await query
  if (subsErr) throw new Error(`getAllSubscriptions: ${subsErr.message}`)
  if (!subs || subs.length === 0) return []

  // Step 2: fetch extended columns that may not exist on older DB instances.
  // We do this in a separate query so a missing column only degrades gracefully.
  const ids = subs.map((s: Record<string, unknown>) => s.id as string)

  const { data: extended } = await admin
    .from('subscriptions')
    .select('id, branch_id, subscription_type, billing_period, trial_ends_at')
    .in('id', ids)

  const extMap = new Map<string, Record<string, unknown>>()
  for (const row of extended ?? []) {
    extMap.set(row.id as string, row as Record<string, unknown>)
  }

  // Step 3: fetch related plans (select only stable columns + optional newer ones).
  const planIds = [...new Set(subs.map((s: Record<string, unknown>) => s.plan_id as string).filter(Boolean))]
  let plans: Record<string, unknown>[] = []
  if (planIds.length > 0) {
    const { data: planData } = await admin
      .from('subscription_plans')
      .select('id, name, price, plan_type, billing_period, features, yearly_price')
      .in('id', planIds)
    plans = (planData ?? []) as Record<string, unknown>[]
  }
  const planMap = new Map<string, Record<string, unknown>>()
  for (const p of plans) planMap.set(p.id as string, p)

  // Step 4: fetch related pharmacies.
  const pharmacyIds = [...new Set(subs.map((s: Record<string, unknown>) => s.pharmacy_id as string).filter(Boolean))]
  let pharmacies: Record<string, unknown>[] = []
  if (pharmacyIds.length > 0) {
    const { data: pharmData } = await admin
      .from('pharmacies')
      .select('id, name, email, owner_id')
      .in('id', pharmacyIds)
    pharmacies = (pharmData ?? []) as Record<string, unknown>[]
  }
  const pharmacyMap = new Map<string, Record<string, unknown>>()
  for (const ph of pharmacies) pharmacyMap.set(ph.id as string, ph)

  // Step 5: merge everything.
  return subs.map((row: Record<string, unknown>) => {
    const ext = extMap.get(row.id as string) ?? {}
    const plan = planMap.get(row.plan_id as string) ?? null
    const pharmacy = pharmacyMap.get(row.pharmacy_id as string) ?? null
    return {
      ...row,
      branch_id: ext.branch_id ?? null,
      subscription_type: ext.subscription_type ?? 'main',
      billing_period: ext.billing_period ?? 'monthly',
      trial_ends_at: ext.trial_ends_at ?? null,
      plan,
      pharmacy,
    }
  })
}

export async function getAllPlans(admin: SupabaseClient): Promise<SubscriptionPlan[]> {
  const { data, error } = await admin
    .from('subscription_plans')
    .select('*')
    .order('price', { ascending: true })

  if (error) throw new Error(`getAllPlans: ${error.message}`)
  return (data ?? []) as SubscriptionPlan[]
}

export async function createPlan(
  admin: SupabaseClient,
  input: {
    name: string
    price: number
    yearly_price?: number
    yearly_discount_pct?: number
    billing_period: string
    plan_type: string
    max_branches: number
    max_users: number
    monthly_tx_limit: number
    features: string[]
    is_popular?: boolean
  }
): Promise<SubscriptionPlan> {
  const period = input.billing_period === 'free' ? 'free' : `per ${input.billing_period.replace('ly', '')}`

  // Auto-compute yearly_price if not provided
  const discountPct = input.yearly_discount_pct ?? 17
  const yearlyPrice = input.yearly_price !== undefined
    ? input.yearly_price
    : input.price > 0
      ? Math.round(input.price * 12 * (1 - discountPct / 100))
      : 0

  const { data, error } = await admin
    .from('subscription_plans')
    .insert({
      name: input.name,
      price: input.price,
      yearly_price: yearlyPrice,
      yearly_discount_pct: discountPct,
      period,
      billing_period: input.billing_period,
      plan_type: input.plan_type,
      max_branches: input.max_branches,
      max_users: input.max_users,
      monthly_tx_limit: input.monthly_tx_limit,
      features: input.features,
      is_popular: input.is_popular ?? false,
      is_active: true,
    })
    .select()
    .single()

  if (error) throw new Error(`createPlan: ${error.message}`)
  return data as SubscriptionPlan
}

// ─── Admin: grant free trial ───────────────────────────────

export async function grantFreeTrial(
  admin: SupabaseClient,
  params: {
    pharmacy_id: string
    plan_id: string
    trial_days: number
    granted_by?: string // admin user id for audit
  }
): Promise<Subscription> {
  const { pharmacy_id, plan_id, trial_days } = params

  if (trial_days < 1 || trial_days > 365) {
    throw new Error('trial_days must be between 1 and 365')
  }

  const plan = await getPlanById(admin, plan_id)
  if (!plan) throw new Error('Plan not found')
  if (!plan.is_active) throw new Error('Plan is not available')

  const now = new Date()
  const trialEnd = new Date(now)
  trialEnd.setDate(trialEnd.getDate() + trial_days)

  // Cancel any existing active main subscription first
  await admin
    .from('subscriptions')
    .update({ status: 'cancelled', cancelled_at: now.toISOString() })
    .eq('pharmacy_id', pharmacy_id)
    .eq('subscription_type', 'main')
    .eq('status', 'active')

  const { data, error } = await admin
    .from('subscriptions')
    .insert({
      pharmacy_id,
      plan_id,
      branch_id: null,
      subscription_type: 'main',
      billing_period: 'free',
      status: 'trialing',
      is_active: true,
      plan: 'standard', // legacy enum
      current_period_start: now.toISOString(),
      current_period_end: trialEnd.toISOString(),
      trial_ends_at: trialEnd.toISOString(),
    })
    .select('*, plan:subscription_plans!plan_id(*)')
    .single()

  if (error) throw new Error(`grantFreeTrial: ${error.message}`)

  const sub = data as Subscription

  // Provision usage for all active branches
  const branches = await getPharmacyBranches(admin, pharmacy_id)
  await Promise.all(
    branches.map(b =>
      admin.rpc('provision_branch_usage', {
        p_branch_id: b.id,
        p_pharmacy_id: pharmacy_id,
        p_subscription_id: sub.id,
        p_tx_limit: plan.monthly_tx_limit,
      })
    )
  )

  // Update pharmacy status
  await admin
    .from('pharmacies')
    .update({
      status: 'active',
      subscription_plan: 'free',
      subscription_expires_at: trialEnd.toISOString(),
    })
    .eq('id', pharmacy_id)

  // Send activation email (non-blocking)
  try {
    const { data: pharmacy } = await admin
      .from('pharmacies')
      .select('name, email, owner_id')
      .eq('id', pharmacy_id)
      .maybeSingle()

    let recipientEmail: string | null = (pharmacy?.email as string | null)?.trim() ?? null

    if (!recipientEmail) {
      const { data: ownerMember } = await admin
        .from('pharmacy_users')
        .select('user_id')
        .eq('pharmacy_id', pharmacy_id)
        .eq('role', 'pharmacy_owner')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()

      const ownerUserId: string | null =
        (ownerMember?.user_id as string | null) ??
        (pharmacy?.owner_id as string | null) ??
        null

      if (ownerUserId) {
        const { data: authUser } = await admin.auth.admin.getUserById(ownerUserId)
        recipientEmail = authUser?.user?.email?.trim() ?? null
      }
    }

    if (recipientEmail) {
      void sendSubscriptionActivatedEmail({
        to: recipientEmail,
        pharmacyName: (pharmacy?.name as string) ?? 'Your pharmacy',
        planName: `${plan.name} (${trial_days}-day free trial)`,
        periodEnd: trialEnd.toLocaleDateString('en-RW', { dateStyle: 'medium' }),
        isRenewal: false,
      })
    }
  } catch { /* non-fatal */ }

  return sub
}

export async function updatePlan(
  admin: SupabaseClient,
  planId: string,
  updates: Partial<{
    name: string
    price: number
    yearly_price: number
    yearly_discount_pct: number
    billing_period: string
    plan_type: string
    max_branches: number
    max_users: number
    monthly_tx_limit: number
    features: string[]
    is_popular: boolean
    is_active: boolean
  }>
): Promise<SubscriptionPlan> {
  const payload: Record<string, unknown> = { ...updates }

  if (updates.billing_period) {
    payload.period = updates.billing_period === 'free'
      ? 'free'
      : `per ${updates.billing_period.replace('ly', '')}`
  }

  // Auto-recalculate yearly_price when price or discount changes
  // (the DB trigger also does this, but we keep the payload consistent)
  const price = updates.price
  const discountPct = updates.yearly_discount_pct
  if (price !== undefined || discountPct !== undefined) {
    // We need both values to compute — fetch current plan if one is missing
    if (price !== undefined && discountPct !== undefined) {
      const billingPeriod = updates.billing_period
      const isFree = billingPeriod === 'free' || price === 0
      payload.yearly_price = isFree
        ? 0
        : Math.round(price * 12 * (1 - discountPct / 100))
      payload.yearly_discount_pct = discountPct
    }
    // If only one is provided, the DB trigger will handle recalculation
  }

  const { data, error } = await admin
    .from('subscription_plans')
    .update(payload)
    .eq('id', planId)
    .select()
    .single()

  if (error) throw new Error(`updatePlan: ${error.message}`)
  return data as SubscriptionPlan
}
