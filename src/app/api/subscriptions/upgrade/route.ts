import { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '../../../../../supabase/route-handler'
import { createServiceClient } from '../../../../../supabase/service'
import { createSubscriptionUpgrade } from '@/lib/subscription/create-pending-upgrade'

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

    const result = await createSubscriptionUpgrade(admin, pharmacyId, {
      id: plan.id as string,
      name: String(plan.name),
      price: plan.price,
      period: plan.period as string | null,
    })

    if (paymentTransactionId) {
      await admin
        .from('payment_transactions')
        .update({ subscription_id: result.id })
        .eq('id', paymentTransactionId)
    }

    return json({
      success: true,
      subscription: {
        id: result.id,
        planId: result.planId,
        planName: result.planName,
        amount: result.amount,
        requiresPayment: result.requiresPayment,
        isActive: result.isActive,
        expiresAt: result.expiresAt,
      },
    })

  } catch (error: unknown) {
    console.error('Upgrade route error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return json({ error: message }, { status: 500 })
  }
}
