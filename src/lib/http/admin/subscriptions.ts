import { fetchJson } from '../client'

export const adminSubscriptionsQueryKey = ['admin', 'saas-subscriptions'] as const

// ─── Types ────────────────────────────────────────────────

export interface AdminSubscriberPlan {
  id: string
  name: string
  price: number
  yearly_price?: number
  plan_type: string
  billing_period: string
  features?: string[]
}

export interface AdminSubscriberPharmacy {
  id: string
  name: string
  email: string | null
  owner_id: string | null
}

export interface AdminSubscriberRow {
  id: string
  pharmacy_id: string
  plan_id: string
  subscription_type: string
  billing_period: string
  status: string
  is_active: boolean
  current_period_start: string | null
  current_period_end: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
  plan: AdminSubscriberPlan | null
  pharmacy: AdminSubscriberPharmacy | null
}

export interface AdminSubscriptionActionResult {
  ok: boolean
  action: string
}

// ─── Fetch all subscriptions ──────────────────────────────

export async function getAdminSubscriptions(
  status?: string
): Promise<AdminSubscriberRow[]> {
  const url = status
    ? `/api/saas/admin/subscriptions?status=${status}&limit=500`
    : '/api/saas/admin/subscriptions?limit=500'
  const data = await fetchJson<{ subscriptions: AdminSubscriberRow[] }>(url)
  return data.subscriptions ?? []
}

// ─── Suspend a subscription ───────────────────────────────

export async function suspendAdminSubscription(
  id: string,
  reason?: string
): Promise<AdminSubscriptionActionResult> {
  return fetchJson<AdminSubscriptionActionResult>(
    `/api/saas/admin/subscriptions/${id}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'suspend', reason }),
    }
  )
}

// ─── Reactivate a subscription ────────────────────────────

export async function reactivateAdminSubscription(
  id: string
): Promise<AdminSubscriptionActionResult> {
  return fetchJson<AdminSubscriptionActionResult>(
    `/api/saas/admin/subscriptions/${id}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reactivate' }),
    }
  )
}
