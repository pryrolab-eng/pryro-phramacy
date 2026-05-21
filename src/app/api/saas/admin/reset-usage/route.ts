// POST /api/saas/admin/reset-usage
// Super admin: manually trigger monthly usage reset.

import { NextResponse } from 'next/server'
import { createClient } from '../../../../../../supabase/server'
import { createServiceClient } from '../../../../../../supabase/service'

export async function POST() {
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

    const admin = createServiceClient()
    const { data, error } = await admin.rpc('reset_monthly_branch_usage')
    if (error) throw new Error(error.message)

    return NextResponse.json({ reset_count: data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Reset failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
