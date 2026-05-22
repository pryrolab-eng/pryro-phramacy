// PATCH /api/saas/admin/subscriptions/[id]
// Super admin: suspend or reactivate a subscription.
// Body: { action: 'suspend' | 'reactivate', reason?: string }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../../supabase/server'
import { createServiceClient } from '../../../../../../../supabase/service'
import {
  adminSuspendSubscription,
  adminReactivateSubscription,
} from '@/lib/saas/subscription-lifecycle'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('is_platform_admin')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.is_platform_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json() as { action: string; reason?: string }
    const { action, reason } = body

    if (!['suspend', 'reactivate'].includes(action)) {
      return NextResponse.json({ error: 'action must be suspend or reactivate' }, { status: 400 })
    }

    const admin = createServiceClient()

    if (action === 'suspend') {
      await adminSuspendSubscription(admin, id, reason)
      return NextResponse.json({ ok: true, action: 'suspended' })
    } else {
      await adminReactivateSubscription(admin, id)
      return NextResponse.json({ ok: true, action: 'reactivated' })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Action failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
