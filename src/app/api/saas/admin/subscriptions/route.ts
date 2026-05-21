// GET /api/saas/admin/subscriptions
// Super admin: view all subscriptions across all pharmacies.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../supabase/server'
import { createServiceClient } from '../../../../../../supabase/service'
import { getAllSubscriptions } from '@/lib/saas/subscription-engine'

export async function GET(request: NextRequest) {
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

    const status = request.nextUrl.searchParams.get('status') ?? undefined
    const limit = Number(request.nextUrl.searchParams.get('limit') ?? 50)
    const offset = Number(request.nextUrl.searchParams.get('offset') ?? 0)

    const admin = createServiceClient()
    const subscriptions = await getAllSubscriptions(admin, { status, limit, offset })
    return NextResponse.json({ subscriptions })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load subscriptions'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
