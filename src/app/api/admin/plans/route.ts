import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '../../../../../supabase/server'
import { resolveIsAppPlatformAdmin } from '@/lib/platform-admin'
import { syncPlanToPolarAndSave } from '@/lib/polar/sync-plan-db'
import { dedupeSubscriptionPlansByName, findDuplicatePlanGroups } from '@/lib/subscription/dedupe-plans'
import {
  countActiveSubscribersByPlanId,
  subscriberCountForPlan,
} from '@/lib/admin/plan-subscriber-counts'
import {
  findPlanNameConflict,
  formatPlanNameConflictError,
  isPostgresUniqueViolation,
  normalizePlanType,
} from '@/lib/subscription/plan-name-validation'

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

    let subscriberCounts = {
      byPlanId: new Map<string, number>(),
      byPlanName: new Map<string, number>(),
    }
    try {
      subscriberCounts = await countActiveSubscribersByPlanId(db)
    } catch (subsError) {
      console.error('GET /api/admin/plans: subscriptions aggregate', subsError)
    }

    const catalog = dedupeSubscriptionPlansByName(plans ?? [])
    const duplicateGroups = findDuplicatePlanGroups(plans ?? [], { activeOnly: true })

    const planIds = catalog.map((p) => (p as { id: string }).id)
    const [{ data: planFeatureRows }, { data: booleanFeatureRows }] = await Promise.all([
      db
        .from('plan_features')
        .select('plan_id, feature_key')
        .in('plan_id', planIds.length ? planIds : ['00000000-0000-0000-0000-000000000000'])
        .eq('enabled', true),
      db.from('platform_features').select('key').eq('feature_type', 'boolean'),
    ])

    const booleanKeySet = new Set(
      (booleanFeatureRows ?? []).map((row) => row.key as string),
    )

    const keysByPlan = new Map<string, string[]>()
    for (const row of planFeatureRows ?? []) {
      const featureKey = row.feature_key as string
      if (!booleanKeySet.has(featureKey)) continue
      const pid = row.plan_id as string
      const list = keysByPlan.get(pid) ?? []
      list.push(featureKey)
      keysByPlan.set(pid, list)
    }

    const enriched = catalog.map((p) => {
      const name = (p as { name?: string }).name ?? ''
      const id = (p as { id: string }).id
      return {
        ...p,
        active_subscriber_count: subscriberCountForPlan(
          { id, name },
          subscriberCounts,
        ),
        feature_keys: keysByPlan.get(id) ?? [],
      }
    })

    return NextResponse.json({
      plans: enriched,
      duplicateGroups: duplicateGroups.map((g) => ({
        key: g.name,
        keeperId: g.keeperId,
        duplicateIds: g.duplicateIds,
      })),
    })
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
      .select('id, name, plan_type')
      .eq('is_active', true)

    const requestedType = normalizePlanType(body.plan_type)

    const conflict = findPlanNameConflict(
      (existing ?? []) as { id: string; name: string; plan_type?: string | null; is_active?: boolean | null }[],
      planName,
      requestedType,
    )
    if (conflict) {
      return NextResponse.json(
        {
          success: false,
          error: formatPlanNameConflictError(conflict, planName),
        },
        { status: 409 },
      )
    }

    const { billingPeriodFromInput, periodLabelFromBilling } =
      await import('@/lib/subscription/plan-period')
    const price = Number(body.price ?? 0)
    const cadence =
      body.billing_cadence === 'yearly' || body.billing_period === 'yearly'
        ? 'yearly'
        : 'monthly'
    const billing_period = billingPeriodFromInput(price, cadence)
    const period = periodLabelFromBilling(billing_period)

    const featureKeys = Array.isArray(body.feature_keys)
      ? (body.feature_keys as string[])
      : Array.isArray(body.featureKeys)
        ? (body.featureKeys as string[])
        : []

    const limitValidation = (
      await import('@/lib/subscription/plan-limit-alignment')
    ).validateMainPlanLimitAlignment({
      plan_type: requestedType,
      max_branches: requestedType === 'branch_addon' ? 1 : Number(body.max_branches ?? 1),
      max_users: Number(body.max_users ?? 5),
      monthly_tx_limit: Number(body.monthly_tx_limit ?? 500),
      feature_keys: featureKeys,
    })
    if (limitValidation) {
      return NextResponse.json({ success: false, error: limitValidation }, { status: 400 })
    }

    const { data: plan, error } = await db
      .from('subscription_plans')
      .insert({
        name: body.name,
        price: body.price,
        period,
        features: body.features,
        is_popular: body.is_popular || false,
        is_active: true,
        plan_type: requestedType,
        billing_period,
        max_branches: requestedType === 'branch_addon' ? 1 : Number(body.max_branches ?? 1),
        max_users: Number(body.max_users ?? 5),
        monthly_tx_limit: Number(body.monthly_tx_limit ?? 500),
      })
      .select()
      .single()

    if (error) throw error

    if (featureKeys.length > 0 && requestedType === 'main') {
      const { validateRequiredMainPlanKeys, syncPlanFeatures, syncPlanMarketingFeatures } =
        await import('@/lib/subscription/plan-features')
      const validation = validateRequiredMainPlanKeys(featureKeys)
      if (validation) {
        return NextResponse.json({ success: false, error: validation }, { status: 400 })
      }
      await syncPlanFeatures(db, plan.id as string, featureKeys)
      await syncPlanMarketingFeatures(db, plan.id as string, featureKeys)
    }

    const synced = await syncPlanToPolarAndSave(db, plan as Parameters<typeof syncPlanToPolarAndSave>[1])

    return NextResponse.json({
      success: true,
      plan: { ...synced.plan, feature_keys: featureKeys },
      polarSync: synced.polarSync,
    })
  } catch (error) {
    if (isPostgresUniqueViolation(error)) {
      return NextResponse.json(
        {
          success: false,
          error: 'A plan with this name already exists. Edit the existing plan or remove duplicates first.',
        },
        { status: 409 },
      )
    }
    console.error('POST /api/admin/plans', error)
    return NextResponse.json({ success: false, error: 'Failed to add plan' }, { status: 500 })
  }
}
