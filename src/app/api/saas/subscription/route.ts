// GET /api/saas/subscription
// Returns the full subscription summary for the current pharmacy owner.

import { NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'
import { createServiceClient } from '../../../../../supabase/service'
import { getPharmacySubscriptionSummary } from '@/lib/saas/subscription-engine'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createServiceClient()

    const { data: membership } = await admin
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (!membership?.pharmacy_id) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 404 })
    }

    const summary = await getPharmacySubscriptionSummary(admin, membership.pharmacy_id)
    return NextResponse.json({ summary })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load subscription'
    console.error('[GET /api/saas/subscription]', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
