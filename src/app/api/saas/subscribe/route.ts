// POST /api/saas/subscribe
// Pharmacy owner subscribes to a plan (main or branch addon).
// Body: { plan_id, subscription_type, branch_id?, billing_cycle? }
// billing_cycle: 'monthly' (default) | 'yearly'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'
import { createServiceClient } from '../../../../../supabase/service'
import { activateSubscription, getPlanById } from '@/lib/saas/subscription-engine'
import type { SubscriptionType } from '@/lib/saas/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      plan_id,
      subscription_type = 'main',
      branch_id,
      billing_cycle = 'monthly',
    } = body as {
      plan_id: string
      subscription_type?: SubscriptionType
      branch_id?: string
      billing_cycle?: 'monthly' | 'yearly'
    }

    if (!plan_id) {
      return NextResponse.json({ error: 'plan_id is required' }, { status: 400 })
    }

    const admin = createServiceClient()

    const { data: membership } = await admin
      .from('pharmacy_users')
      .select('pharmacy_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .in('role', ['pharmacy_owner', 'admin'])
      .limit(1)
      .maybeSingle()

    if (!membership?.pharmacy_id) {
      return NextResponse.json({ error: 'Pharmacy not found or insufficient role' }, { status: 403 })
    }

    const plan = await getPlanById(admin, plan_id)
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

    if (subscription_type === 'branch_addon' && !branch_id) {
      return NextResponse.json({ error: 'branch_id is required for branch_addon subscriptions' }, { status: 400 })
    }

    // For yearly billing, override the plan's billing_period for period calculation
    const effectiveBillingPeriod =
      billing_cycle === 'yearly' && plan.billing_period === 'monthly'
        ? 'yearly'
        : plan.billing_period

    const subscription = await activateSubscription(admin, {
      pharmacy_id: membership.pharmacy_id,
      plan_id,
      subscription_type,
      branch_id,
      billing_period_override: effectiveBillingPeriod,
    })

    return NextResponse.json({ subscription }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Subscription failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
