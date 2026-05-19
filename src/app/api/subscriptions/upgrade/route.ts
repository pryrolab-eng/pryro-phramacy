import { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '../../../../../supabase/route-handler'
import { createServiceClient } from '../../../../../supabase/service'

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

    // Catalog read via service role (RLS often blocks subscription_plans for tenants)
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

    const planPrice = Number(plan.price ?? 0)

    await admin
      .from('subscriptions')
      .update({ is_active: false })
      .eq('pharmacy_id', pharmacyId)

    // Calculate expiry date
    const now = new Date()
    const expiresAt = new Date(now)
    
    if (plan.period === 'per month' || plan.period === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    } else if (plan.period === 'per year' || plan.period === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 100)
    }

    const planEnum = (() => {
      const n = (plan.name || '').toLowerCase()
      if (n.includes('premium')) return 'premium' as const
      if (n.includes('standard')) return 'standard' as const
      return 'trial' as const
    })()

    const { data: subscription, error: subscriptionError } = await admin
      .from('subscriptions')
      .insert({
        pharmacy_id: pharmacyId,
        plan_id: plan.id,
        plan: planEnum,
        is_active: planPrice === 0,
        expires_at: expiresAt.toISOString(),
        payment_method: planPrice === 0 ? 'free' : 'pending',
      })
      .select()
      .single()

    if (subscriptionError) {
      console.error('Subscription creation error:', subscriptionError)
      return json({ error: `Subscription error: ${subscriptionError.message}` }, { status: 500 })
    }

    await admin
      .from('pharmacies')
      .update({
        subscription_plan: planEnum,
        subscription_expires_at: expiresAt.toISOString(),
        status:
          planPrice === 0 && subscription.is_active
            ? planEnum === 'trial'
              ? 'trial'
              : 'active'
            : 'trial',
      })
      .eq('id', pharmacyId)

    if (paymentTransactionId) {
      await admin
        .from('payment_transactions')
        .update({ subscription_id: subscription.id })
        .eq('id', paymentTransactionId)
    }

    return json({
      success: true,
      subscription: {
        id: subscription.id,
        planId: plan.id,
        planName: plan.name,
        amount: planPrice,
        requiresPayment: planPrice > 0,
        isActive: subscription.is_active,
        expiresAt: subscription.expires_at
      }
    })

  } catch (error: unknown) {
    console.error('Upgrade route error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return json({ error: message }, { status: 500 })
  }
}
