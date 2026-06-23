// ─────────────────────────────────────────────────────────────
// SaaS Subscription System — Shared Types
// ─────────────────────────────────────────────────────────────

export type PlanType = 'main' | 'branch_addon'
export type BillingPeriod = 'monthly' | 'yearly' | 'free'
export type SubscriptionStatus = 'active' | 'pending' | 'pending_payment' | 'cancelled' | 'expired' | 'past_due'
export type SubscriptionType = 'main' | 'branch_addon'
export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'void'

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  period: string
  billing_period: BillingPeriod
  plan_type: PlanType
  max_branches: number
  max_users: number
  monthly_tx_limit: number
  features: string[]
  is_popular: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  pharmacy_id: string
  plan_id: string
  branch_id: string | null
  subscription_type: SubscriptionType
  status: SubscriptionStatus
  is_active: boolean
  current_period_start: string | null
  current_period_end: string | null
  cancelled_at: string | null
  trial_ends_at: string | null
  created_at: string
  updated_at: string
  // joined
  plan?: SubscriptionPlan
}

export interface BranchUsage {
  id: string
  branch_id: string
  pharmacy_id: string
  subscription_id: string | null
  billing_cycle_start: string
  billing_cycle_end: string
  tx_count: number
  tx_limit: number
  is_blocked: boolean
  reset_at: string | null
  created_at: string
  updated_at: string
}

export interface Branch {
  id: string
  pharmacy_id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  is_active: boolean
  /** Main distribution site; satellite branches stock via transfers from HQ. */
  is_headquarters?: boolean
  created_at: string
  updated_at: string
}

export interface SubscriptionInvoice {
  id: string
  pharmacy_id: string
  invoice_number: string
  billing_month: string
  subtotal: number
  total: number
  status: InvoiceStatus
  due_date: string
  paid_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  lines?: SubscriptionInvoiceLine[]
}

export interface SubscriptionInvoiceLine {
  id: string
  invoice_id: string
  subscription_id: string | null
  branch_id: string | null
  description: string
  amount: number
  created_at: string
}

// ─── API response shapes ───────────────────────────────────

export interface PharmacySubscriptionSummary {
  pharmacy_id: string
  main_subscription: Subscription | null
  branch_subscriptions: Subscription[]
  branches: (Branch & { usage: BranchUsage | null })[]
  total_monthly_cost: number
  branch_limit: number
  branch_count: number
  can_add_branch: boolean
  /** Branches included in the main plan (before add-ons) */
  main_plan_branch_slots?: number
  addon_subscription_count?: number
}

export interface TransactionCheckResult {
  allowed: boolean
  reason?: 'no_subscription' | 'limit_reached' | 'branch_inactive'
  tx_count?: number
  tx_limit?: number
  remaining?: number
  message?: string
}

export interface ActivateSubscriptionParams {
  pharmacy_id: string
  plan_id: string
  branch_id?: string
  subscription_type: SubscriptionType
}
