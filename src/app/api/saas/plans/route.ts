// GET  /api/saas/plans  — public list of active plans
// POST /api/saas/plans  — admin: create a plan

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { prisma } from '@/lib/db/prisma'
import { resolveIsAppPlatformAdmin } from '@/lib/platform-admin'
import { createPlan, getActivePlans } from '@/lib/saas/subscription-engine'
import {
  findPlanNameConflict,
  formatPlanNameConflictError,
  normalizePlanType,
} from '@/lib/subscription/plan-name-validation'
import {
  storeSyncPlanFeatures,
  storeSyncPlanMarketingFeatures,
} from '@/lib/db/plan-features-store'
import { validateRequiredMainPlanKeys } from '@/lib/subscription/plan-features'

export async function GET() {
  try {
    const plans = await getActivePlans()
    return NextResponse.json({ plans })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load plans'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const isAdmin = await resolveIsAppPlatformAdmin(user.id)
    if (!isAdmin) {
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

    const planName = String(name).trim()
    const existing = await prisma.subscription_plans.findMany({
      where: { is_active: true },
      select: { id: true, name: true, plan_type: true, is_active: true },
    })

    const requestedType = normalizePlanType(plan_type)
    const conflict = findPlanNameConflict(
      existing,
      planName,
      requestedType,
    )
    if (conflict) {
      return NextResponse.json(
        { error: formatPlanNameConflictError(conflict, planName) },
        { status: 409 },
      )
    }

    const plan = await createPlan({
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
      await storeSyncPlanFeatures(plan.id, featureKeys)
      await storeSyncPlanMarketingFeatures(plan.id, featureKeys)
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
