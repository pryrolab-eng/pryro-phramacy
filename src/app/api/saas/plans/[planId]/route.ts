// PUT    /api/saas/plans/[planId]  — admin: update a plan
// DELETE /api/saas/plans/[planId]  — admin: deactivate a plan

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { resolveIsAppPlatformAdmin } from '@/lib/platform-admin'
import { updatePlan } from '@/lib/saas/subscription-engine'

async function requirePlatformAdmin(userId: string) {
  const user = await getAuthUser();
  if (!user) return null
  const isAdmin = await resolveIsAppPlatformAdmin(userId)
  return isAdmin ? user : null
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const adminUser = await requirePlatformAdmin(user.id)
    if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { planId } = await params
    const body = await request.json()
    const plan = await updatePlan(planId, body)
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
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const adminUser = await requirePlatformAdmin(user.id)
    if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { planId } = await params
    await updatePlan(planId, { is_active: false })
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to deactivate plan'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
