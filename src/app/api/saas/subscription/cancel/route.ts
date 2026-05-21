// POST /api/saas/subscription/cancel
// Body: { subscription_id }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../supabase/server'
import { createServiceClient } from '../../../../../../supabase/service'
import { cancelSubscription } from '@/lib/saas/subscription-engine'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { subscription_id } = await request.json()
    if (!subscription_id) {
      return NextResponse.json({ error: 'subscription_id is required' }, { status: 400 })
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await cancelSubscription(admin, subscription_id, membership.pharmacy_id)
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to cancel subscription'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
