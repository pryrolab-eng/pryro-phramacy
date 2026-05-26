// GET  /api/saas/plans  — public list of active plans
// POST /api/saas/plans  — admin: create a plan

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'
import { createServiceClient } from '../../../../../supabase/service'
import { createPlan, getActivePlans } from '@/lib/saas/subscription-engine'
import {
  findPlanNameConflict,
  formatPlanNameConflictError,
  normalizePlanType,
} from '@/lib/subscription/plan-name-validation'
import {
  syncPlanFeatures,
  syncPlanMarketingFeatures,
  validateRequiredMainPlanKeys,
} from '@/lib/subscription/plan-features'

export async function GET() {
  try {
    const admin = createServiceClient()
    const plans = await getActivePlans(admin)
    return NextResponse.json({ plans })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load plans'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Only platform admins can create plans
    const { data: profile } = await supabase
      .from('users')
      .select('is_platform_admin')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.is_platform_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name, price, billing_period, plan_type,
      max_branches, max_users, monthly_tx_limit,
      features, is_popular,
      feature_keys: featureKeysBody,
      featureKeys: featureKeysAlt,
    } = body
    const featureKeys = Array.isArray(featureKeysBody)
      ? featureKeysBody
      : Array.isArray(featureKeysAlt)
        ? featureKeysAlt
        : []

    if (!name || price === undefined || !billing_period || !plan_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = createServiceClient()
    const planName = String(name).trim()
    const { data: existing } = await admin
      .from('subscription_plans')
      .select('id, name, plan_type, is_active')
      .eq('is_active', true)

    const requestedType = normalizePlanType(plan_type)
    const conflict = findPlanNameConflict(
      (existing ?? []) as {
        id: string
        name: string
        plan_type?: string | null
        is_active?: boolean | null
      }[],
      planName,
      requestedType,
    )
    if (conflict) {
      return NextResponse.json(
        { error: formatPlanNameConflictError(conflict, planName) },
        { status: 409 },
      )
    }

    const plan = await createPlan(admin, {
      name: planName,
      price: Number(price),
      billing_period,
      plan_type,
      max_branches: Number(max_branches ?? 1),
      max_users: Number(max_users ?? 5),
      monthly_tx_limit: Number(monthly_tx_limit ?? 500),
      features: Array.isArray(features) ? features : [],
      is_popular: Boolean(is_popular),
    })

    if (featureKeys.length > 0 && requestedType === 'main') {
      const validation = validateRequiredMainPlanKeys(featureKeys)
      if (validation) {
        return NextResponse.json({ error: validation }, { status: 400 })
      }
      await syncPlanFeatures(admin, plan.id as string, featureKeys)
      await syncPlanMarketingFeatures(admin, plan.id as string, featureKeys)
    }

    return NextResponse.json(
      { plan: { ...plan, feature_keys: featureKeys } },
      { status: 201 },
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create plan'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
