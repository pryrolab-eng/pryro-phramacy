// POST /api/saas/subscription/cancel
// Body: { subscription_id }

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { storeFindFirstActiveMembership } from '@/lib/db/pharmacy-users-store'
import { cancelSubscription } from '@/lib/saas/subscription-engine'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { subscription_id } = await request.json()
    if (!subscription_id) {
      return NextResponse.json({ error: 'subscription_id is required' }, { status: 400 })
    }

    const membership = await storeFindFirstActiveMembership(user.id, {
      roles: ['pharmacy_owner', 'admin'],
    })

    if (!membership?.pharmacy_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await cancelSubscription(subscription_id, membership.pharmacy_id)
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to cancel subscription'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
