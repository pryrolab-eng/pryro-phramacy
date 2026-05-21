// PUT    /api/saas/plans/[planId]  — admin: update a plan
// DELETE /api/saas/plans/[planId]  — admin: deactivate a plan

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../supabase/server'
import { createServiceClient } from '../../../../../../supabase/service'
import { updatePlan } from '@/lib/saas/subscription-engine'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users')
    .select('is_platform_admin')
    .eq('id', user.id)
    .maybeSingle()
  return profile?.is_platform_admin ? user : null
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const supabase = await createClient()
    const user = await requireAdmin(supabase)
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { planId } = await params
    const body = await request.json()
    const admin = createServiceClient()
    const plan = await updatePlan(admin, planId, body)
    return NextResponse.json({ plan })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update plan'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const supabase = await createClient()
    const user = await requireAdmin(supabase)
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { planId } = await params
    const admin = createServiceClient()
    await updatePlan(admin, planId, { is_active: false })
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to deactivate plan'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
