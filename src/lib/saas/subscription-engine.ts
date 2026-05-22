// ─────────────────────────────────────────────────────────────
// SaaS Subscription Engine
// All business logic for subscriptions, usage, and billing.
// Uses service-role client — call only from server-side code.
// ─────────────────────────────────────────────────────────────

import type { SupabaseClient } from '@supabase/supabase-js'
import { createSubscriptionOrchestrator } from '@/lib/subscription/orchestrator'
import { resolvePharmacyEntitlements } from '@/lib/subscription/lifecycle/entitlements'
import { getBranchCapacity } from '@/lib/subscription/branch-addon-capacity'
import { provisionBranchUsageForBranch } from '@/lib/subscription/provision-branch-usage'
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
    end.setFullYear(end.getFullYear() + 100)
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
    .in('status', ['active', 'pending_payment', 'scheduled_change', 'pending'])
    .order('created_at', { ascending: false })

  if (error) throw new Error(`getPharmacySubscriptions: ${error.message}`)
  return (data ?? []) as Subscription[]
}

export async function getPharmacyMainSubscription(
  admin: SupabaseClient,
  pharmacyId: string
): Promise<Subscription | null> {
  const ent = await resolvePharmacyEntitlements(admin, pharmacyId)
  if (!ent.subscriptionId) return null

  const { data, error } = await admin
    .from('subscriptions')
    .select('*, plan:subscription_plans!plan_id(*)')
    .eq('id', ent.subscriptionId)
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
  const [subscriptions, branches] = await Promise.all([
    getPharmacySubscriptions(admin, pharmacyId),
    getPharmacyBranches(admin, pharmacyId),
  ])

  const mainSub = subscriptions.find(s => s.subscription_type === 'main') ?? null
  const branchSubs = subscriptions.filter(s => s.subscription_type === 'branch_addon')

  const mainPlanSlots =
    (mainSub?.plan as SubscriptionPlan | undefined)?.max_branches ?? 0
  const branchCount = branches.length
  const addonSlots = branchSubs.filter((s) => {
    const st = s.status
    return st === 'active' || st === 'pending_payment' || st === 'pending'
  }).length
  const branchLimit = mainPlanSlots + addonSlots

  // Fetch usage for all branches in parallel
  const branchesWithUsage = await Promise.all(
    branches.map(async (b) => {
      const usage = await getBranchCurrentUsage(admin, b.id)
      return { ...b, usage }
    })
  )

  const totalMonthlyCost = subscriptions.reduce((sum, s) => {
    const price = (s.plan as SubscriptionPlan | undefined)?.price ?? 0
    return sum + Number(price)
  }, 0)

  return {
    pharmacy_id: pharmacyId,
    main_subscription: mainSub,
    branch_subscriptions: branchSubs,
    branches: branchesWithUsage,
    total_monthly_cost: totalMonthlyCost,
    branch_limit: branchLimit,
    branch_count: branchCount,
    can_add_branch: branchCount < branchLimit,
    main_plan_branch_slots: mainPlanSlots,
    addon_subscription_count: addonSlots,
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

  const orch = createSubscriptionOrchestrator(admin)

  // Main plans: unified lifecycle — paid plans stay pending until payment
  if (params.subscription_type === 'main') {
    const price = Number(plan.price ?? 0)
    let subscriptionId: string

    if (price > 0) {
      const pending = await orch.beginPaidPlanChange(
        params.pharmacy_id,
        params.plan_id
      )
      subscriptionId = pending.subscriptionId
    } else {
      const free = await orch.activateFreePlan(params.pharmacy_id, params.plan_id)
      subscriptionId = free.subscriptionId
    }

    const { data, error } = await admin
      .from('subscriptions')
      .select('*, plan:subscription_plans!plan_id(*)')
      .eq('id', subscriptionId)
      .single()

    if (error || !data) {
      throw new Error(error?.message || 'activateSubscription: subscription not found')
    }
    return data as Subscription
  }

  if (!params.branch_id) {
    throw new Error('branch_id is required for branch_addon subscriptions')
  }

  const price = Number(plan.price ?? 0)
  let subscriptionId: string

  if (price > 0) {
    const pending = await orch.beginPaidBranchAddon(
      params.pharmacy_id,
      params.plan_id,
      { branchId: params.branch_id }
    )
    subscriptionId = pending.subscriptionId
  } else {
    throw new Error(
      'Free branch add-ons are not supported via this path. Use POST /api/subscriptions/branch-addon.'
    )
  }

  const { data, error } = await admin
    .from('subscriptions')
    .select('*, plan:subscription_plans!plan_id(*)')
    .eq('id', subscriptionId)
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'activateSubscription: subscription not found')
  }

  return data as Subscription
}

// ─── Cancel subscription ───────────────────────────────────

export async function cancelSubscription(
  admin: SupabaseClient,
  subscriptionId: string,
  pharmacyId: string
): Promise<void> {
  await createSubscriptionOrchestrator(admin).cancelSubscription(
    subscriptionId,
    pharmacyId
  )
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

  const capacity = await getBranchCapacity(admin, pharmacyId)

  if (!capacity.canAddBranch) {
    throw new Error(
      `Branch limit reached (${capacity.totalSlots} allowed). Purchase a branch add-on or upgrade your main plan.`
    )
  }

  if (capacity.needsAddonForNewBranch) {
    throw new Error(
      `Included branch slots are full (${capacity.mainPlanSlots}). Purchase a branch add-on before adding another branch.`
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

  await provisionBranchUsageForBranch(admin, {
    branchId: branch.id,
    pharmacyId,
    subscriptionId: mainSub.id,
    planId: plan.id,
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
    const price = Number(plan?.price ?? 0)
    const label = s.subscription_type === 'main'
      ? `${plan?.name ?? 'Plan'} — Main subscription`
      : `${plan?.name ?? 'Branch Add-on'} — Branch subscription`
    return {
      subscription_id: s.id,
      branch_id: s.branch_id,
      description: label,
      amount: price,
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
  let query = admin
    .from('subscriptions')
    .select(`
      *,
      plan:subscription_plans!plan_id(id, name, price, plan_type),
      pharmacy:pharmacies(id, name, owner_id)
    `)
    .order('created_at', { ascending: false })

  if (opts?.status) query = query.eq('status', opts.status)
  if (opts?.limit) query = query.limit(opts.limit)
  if (opts?.offset) query = query.range(opts.offset, (opts.offset + (opts.limit ?? 20)) - 1)

  const { data, error } = await query
  if (error) throw new Error(`getAllSubscriptions: ${error.message}`)
  return data ?? []
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
  const { data, error } = await admin
    .from('subscription_plans')
    .insert({
      name: input.name,
      price: input.price,
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

export async function updatePlan(
  admin: SupabaseClient,
  planId: string,
  updates: Partial<{
    name: string
    price: number
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

  const { data, error } = await admin
    .from('subscription_plans')
    .update(payload)
    .eq('id', planId)
    .select()
    .single()

  if (error) throw new Error(`updatePlan: ${error.message}`)
  return data as SubscriptionPlan
}
