import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '../../../../../supabase/server'
import { resolveIsAppPlatformAdmin } from '@/lib/platform-admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowed = await resolveIsAppPlatformAdmin(supabase, user.id, null)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Forbidden: platform admin access required' },
        { status: 403 },
      )
    }

    const db = createServiceClient()
    const { data: plans, error: plansError } = await db
      .from('subscription_plans')
      .select('*')
      .order('is_active', { ascending: false })
      .order('price', { ascending: true })

    if (plansError) throw plansError

    const { data: subs, error: subsError } = await db
      .from('subscriptions')
      .select('plan')
      .eq('is_active', true)

    if (subsError) {
      console.error('GET /api/admin/plans: subscriptions aggregate', subsError)
    }

    const counts: Record<string, number> = {}
    for (const s of subs ?? []) {
      const row = s as { plan?: string | null }
      const k = String(row.plan ?? 'unknown').toLowerCase()
      counts[k] = (counts[k] ?? 0) + 1
    }

    const enriched = (plans ?? []).map((p) => {
      const name = (p as { name?: string }).name ?? ''
      return {
        ...p,
        active_subscriber_count: counts[name.toLowerCase()] ?? 0,
      }
    })

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('GET /api/admin/plans', error)
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const allowed = await resolveIsAppPlatformAdmin(supabase, user.id, null)
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: platform admin access required' },
        { status: 403 },
      )
    }

    const body = await request.json()

    const db = createServiceClient()
    const { data: plan, error } = await db
      .from('subscription_plans')
      .insert({
        name: body.name,
        price: body.price,
        period: body.period || 'per month',
        features: body.features,
        is_popular: body.is_popular || false,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, plan })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to add plan' }, { status: 500 })
  }
}
