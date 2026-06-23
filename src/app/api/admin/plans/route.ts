import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdminApi } from '@/lib/admin/require-platform-admin'
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
import {
  createSubscriptionPlanFromDb,
  listActiveSubscriptionPlansForConflictFromDb,
  listAllSubscriptionPlansFromDb,
  listEnabledPlanFeaturesByPlanIdsFromDb,
} from '@/lib/db/admin'
import { storeListPlatformFeatures } from '@/lib/db/plan-features-store'
import { auditRequestMetadata, writeAuditLog } from '@/lib/db/audit-logs'

export async function GET() {
  try {
    const auth = await requirePlatformAdminApi()
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const plans = await listAllSubscriptionPlansFromDb()

    let subscriberCounts = {
      byPlanId: new Map<string, number>(),
      byPlanName: new Map<string, number>(),
    }
    try {
      subscriberCounts = await countActiveSubscribersByPlanId()
    } catch (subsError) {
      console.error('GET /api/admin/plans: subscriptions aggregate', subsError)
    }

    const planRows = (plans ?? []) as Array<{
      id: string
      name: string
      plan_type?: string | null
      price?: number | string | null
      polar_product_id?: string | null
      is_active?: boolean | null
      updated_at?: string | null
      created_at?: string | null
    }>
    const catalog = dedupeSubscriptionPlansByName(planRows)
    const duplicateGroups = findDuplicatePlanGroups(planRows, { activeOnly: true })

    const planIds = catalog.map((p) => (p as { id: string }).id)
    const [planFeatureRows, booleanFeatureRows] = await Promise.all([
      listEnabledPlanFeaturesByPlanIdsFromDb(planIds),
      storeListPlatformFeatures({ includeInactive: true }),
    ])

    const booleanKeySet = new Set(
      booleanFeatureRows
        .filter((row) => row.feature_type === 'boolean')
        .map((row) => row.key),
    )

    const keysByPlan = new Map<string, string[]>()
    for (const row of planFeatureRows) {
      const featureKey = row.feature_key
      if (!booleanKeySet.has(featureKey)) continue
      const pid = row.plan_id
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
    const auth = await requirePlatformAdminApi()
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status },
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

    const existing = await listActiveSubscriptionPlansForConflictFromDb()
    const requestedType = normalizePlanType(body.plan_type)

    const conflict = findPlanNameConflict(
      existing,
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

    const plan = await createSubscriptionPlanFromDb({
      name: body.name,
      price: body.price,
      period,
      features: body.features ?? [],
      is_popular: body.is_popular || false,
      is_active: true,
      plan_type: requestedType,
      billing_period,
      max_branches: requestedType === 'branch_addon' ? 1 : Number(body.max_branches ?? 1),
      max_users: Number(body.max_users ?? 5),
      monthly_tx_limit: Number(body.monthly_tx_limit ?? 500),
    })

    if (featureKeys.length > 0 && requestedType === 'main') {
      const { validateRequiredMainPlanKeys, syncPlanFeatures, syncPlanMarketingFeatures } =
        await import('@/lib/subscription/plan-features')
      const validation = validateRequiredMainPlanKeys(featureKeys)
      if (validation) {
        return NextResponse.json({ success: false, error: validation }, { status: 400 })
      }
      await syncPlanFeatures(plan.id as string, featureKeys)
      await syncPlanMarketingFeatures(plan.id as string, featureKeys)
    }

    const synced = await syncPlanToPolarAndSave(plan as Parameters<typeof syncPlanToPolarAndSave>[0])

    await writeAuditLog({
      pharmacyId: null,
      userId: auth.user.id,
      action: 'INSERT',
      tableName: 'subscription_plans',
      recordId: plan.id as string,
      newValues: {
        name: body.name,
        price,
        planType: requestedType,
        billingPeriod: billing_period,
        featureKeys,
        polarSync: synced.polarSync,
      },
      ...auditRequestMetadata(request),
    })

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
