import { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '../../../../../supabase/route-handler'
import { createServiceClient } from '../../../../../supabase/service'
import {
  createSubscriptionOrchestrator,
  SubscriptionPlanChangeError,
} from '@/lib/subscription/orchestrator'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  const { supabase, json } = createRouteHandlerClient(request)

  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { planId, paymentTransactionId } = body

    if (!planId || typeof planId !== 'string') {
      return json({ error: 'Plan is required' }, { status: 400 })
    }

    const admin = createServiceClient()

    const { data: userPharmacy, error: pharmacyError } = await admin
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (pharmacyError) {
      console.error('Pharmacy lookup error:', pharmacyError)
      return json({ error: `Pharmacy error: ${pharmacyError.message}` }, { status: 403 })
    }

    if (!userPharmacy?.pharmacy_id) {
      return json({ error: 'Pharmacy not found' }, { status: 403 })
    }

    const pharmacyId = userPharmacy.pharmacy_id

    let planQuery = admin
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)

    if (UUID_RE.test(planId)) {
      planQuery = planQuery.eq('id', planId)
    } else {
      planQuery = planQuery.ilike('name', planId)
    }

    const { data: plan, error: planError } = await planQuery.maybeSingle()

    if (planError) {
      console.error('Plan lookup error:', planError)
      return json({ error: `Plan error: ${planError.message}` }, { status: 404 })
    }

    if (!plan) {
      return json(
        { error: `Plan "${planId}" not found or is not available` },
        { status: 404 }
      )
    }

    const orch = createSubscriptionOrchestrator(admin)
    const change = await orch.requestPlanChange(pharmacyId, plan.id as string)

    const subscriptionId = change.subscriptionId
    const requiresPayment =
      'requiresPayment' in change && change.requiresPayment === true

    if (paymentTransactionId) {
      await admin
        .from('payment_transactions')
        .update({ subscription_id: subscriptionId })
        .eq('id', paymentTransactionId)
    }

    if (requiresPayment) {
      const pending = change as {
        subscriptionId: string
        planId: string
        planName: string
        amount: number
        status: string
      }
      return json({
        success: true,
        subscription: {
          id: pending.subscriptionId,
          planId: pending.planId,
          planName: pending.planName,
          amount: pending.amount,
          requiresPayment: true,
          isActive: false,
          expiresAt: null,
          status: pending.status,
        },
      })
    }

    const active = change as {
      subscriptionId: string
      planId: string
      planName: string
      expiresAt: string
      status: string
    }
    return json({
      success: true,
      subscription: {
        id: active.subscriptionId,
        planId: active.planId,
        planName: active.planName,
        amount: 0,
        requiresPayment: false,
        isActive: true,
        expiresAt: active.expiresAt,
        status: active.status,
      },
    })

  } catch (error: unknown) {
    console.error('Upgrade route error:', error)
    if (error instanceof SubscriptionPlanChangeError) {
      const status =
        error.code === 'downgrade_use_schedule' ? 400 : 400
      return json(
        {
          error: error.message,
          code: error.code,
          scheduleDowngradeUrl: '/api/subscriptions/schedule-downgrade',
        },
        { status }
      )
    }
    const message = error instanceof Error ? error.message : 'Internal server error'
    return json({ error: message }, { status: 500 })
  }
}
