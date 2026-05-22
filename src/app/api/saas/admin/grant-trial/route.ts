// POST /api/saas/admin/grant-trial
// Platform admin: grant a free trial to a pharmacy on any plan.
// Body: { pharmacy_id, plan_id, trial_days }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../supabase/server'
import { createServiceClient } from '../../../../../../supabase/service'
import { grantFreeTrial, getAllPlans } from '@/lib/saas/subscription-engine'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Platform admin check
    const { data: profile } = await supabase
      .from('users')
      .select('is_platform_admin')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.is_platform_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json() as {
      pharmacy_id?: string
      plan_id?: string
      trial_days?: number
    }

    const { pharmacy_id, plan_id, trial_days } = body

    if (!pharmacy_id) {
      return NextResponse.json({ error: 'pharmacy_id is required' }, { status: 400 })
    }
    if (!plan_id) {
      return NextResponse.json({ error: 'plan_id is required' }, { status: 400 })
    }
    const days = Number(trial_days ?? 0)
    if (!days || days < 1 || days > 365) {
      return NextResponse.json({ error: 'trial_days must be between 1 and 365' }, { status: 400 })
    }

    const admin = createServiceClient()
    const subscription = await grantFreeTrial(admin, {
      pharmacy_id,
      plan_id,
      trial_days: days,
      granted_by: user.id,
    })

    return NextResponse.json({ subscription }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to grant trial'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// GET /api/saas/admin/grant-trial — return available plans for the trial picker
export async function GET() {
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
    const plans = await getAllPlans(admin)
    const mainPlans = plans.filter(p => p.plan_type === 'main' && p.is_active)
    return NextResponse.json({ plans: mainPlans })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load plans'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
