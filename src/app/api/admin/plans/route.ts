import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '../../../../../supabase/server'
import { resolveIsAppPlatformAdmin } from '@/lib/platform-admin'
import { syncPlanToPolarAndSave } from '@/lib/polar/sync-plan-db'
import { dedupeSubscriptionPlansByName, normalizePlanName } from '@/lib/subscription/dedupe-plans'
import { validatePlanFeatures } from '@/lib/saas/feature-access'

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

    // Count active subscribers per plan using plan_id (accurate for new SaaS subscriptions)
    const { data: subs, error: subsError } = await db
      .from('subscriptions')
      .select('plan_id')
      .eq('is_active', true)
      .eq('status', 'active')

    if (subsError) {
      console.error('GET /api/admin/plans: subscriptions aggregate', subsError)
    }

    const counts: Record<string, number> = {}
    for (const s of subs ?? []) {
      const row = s as { plan_id?: string | null }
      if (row.plan_id) {
        counts[row.plan_id] = (counts[row.plan_id] ?? 0) + 1
      }
    }

    const catalog = dedupeSubscriptionPlansByName(plans ?? [])

    const enriched = catalog.map((p) => {
      const planId = (p as { id?: string }).id ?? ''
      return {
        ...p,
        active_subscriber_count: counts[planId] ?? 0,
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
    const planName = String(body.name ?? '').trim()
    if (!planName) {
      return NextResponse.json(
        { success: false, error: 'Plan name is required' },
        { status: 400 },
      )
    }

    const db = createServiceClient()

    const { data: existing } = await db
      .from('subscription_plans')
      .select('id, name')
      .eq('is_active', true)

    const duplicate = (existing ?? []).some(
      (row) => normalizePlanName(String(row.name)) === normalizePlanName(planName),
    )
    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: `A plan named "${planName}" already exists. Please choose a different name or edit the existing plan.`,
        },
        { status: 409 },
      )
    }

    // Validate features — only system-defined features are allowed
    const rawFeatures: string[] = Array.isArray(body.features)
      ? body.features.map(String)
      : typeof body.features === 'string'
        ? body.features.split(',').map((f: string) => f.trim()).filter(Boolean)
        : []

    const invalidFeatures = validatePlanFeatures(rawFeatures)
    if (invalidFeatures.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Unknown feature(s): ${invalidFeatures.join(', ')}. Only system-defined features are allowed.`,
        },
        { status: 400 },
      )
    }

    const { data: plan, error } = await db
      .from('subscription_plans')
      .insert({
        name: body.name,
        price: body.price,
        yearly_discount_pct: Number(body.yearly_discount_pct) || 0,
        period: body.period || 'per month',
        billing_period: body.billing_period || 'monthly',
        plan_type: body.plan_type || 'main',
        max_branches: Number(body.max_branches) || 1,
        max_users: Number(body.max_users) || 5,
        monthly_tx_limit: Number(body.monthly_tx_limit) || 500,
        features: rawFeatures,
        is_popular: body.is_popular || false,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error

    let polarSync: { action: string; error?: string } | undefined
    try {
      const synced = await syncPlanToPolarAndSave(db, plan as Parameters<typeof syncPlanToPolarAndSave>[1])
      polarSync = synced.polarSync
      return NextResponse.json({
        success: true,
        plan: synced.plan,
        polarSync,
      })
    } catch (polarError) {
      console.warn("POST /api/admin/plans Polar sync failed (non-fatal):", polarError)
      return NextResponse.json({
        success: true,
        plan,
        polarSync: {
          action: "failed",
          error: polarError instanceof Error ? polarError.message : "Polar sync failed",
        },
      })
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to add plan' }, { status: 500 })
  }
}
