// POST /api/saas/subscribe
// Pharmacy owner subscribes to a plan (main or branch addon).
// Body: { plan_id, subscription_type, branch_id? }

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { storeFindFirstActiveMembership } from '@/lib/db/pharmacy-users-store'
import { activateSubscription, getPlanById } from '@/lib/saas/subscription-engine'
import type { SubscriptionType } from '@/lib/saas/types'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { plan_id, subscription_type = 'main', branch_id } = body as {
      plan_id: string
      subscription_type?: SubscriptionType
      branch_id?: string
    }

    if (!plan_id) {
      return NextResponse.json({ error: 'plan_id is required' }, { status: 400 })
    }

    const membership = await storeFindFirstActiveMembership(user.id, {
      roles: ['pharmacy_owner', 'admin'],
    })

    if (!membership?.pharmacy_id) {
      return NextResponse.json({ error: 'Pharmacy not found or insufficient role' }, { status: 403 })
    }

    const plan = await getPlanById(plan_id)
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

    if (subscription_type === 'branch_addon' && !branch_id) {
      return NextResponse.json({ error: 'branch_id is required for branch_addon subscriptions' }, { status: 400 })
    }

    const subscription = await activateSubscription({
      pharmacy_id: membership.pharmacy_id,
      plan_id,
      subscription_type,
      branch_id,
    })

    const requiresPayment = (subscription.status as string) === 'pending_payment'

    return NextResponse.json(
      {
        subscription,
        requiresPayment,
        message: requiresPayment
          ? 'Complete checkout to activate this plan.'
          : undefined,
      },
      { status: 201 }
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Subscription failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
