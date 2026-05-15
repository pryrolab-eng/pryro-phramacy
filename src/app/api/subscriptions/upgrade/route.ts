import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { planId, paymentTransactionId } = body

    console.log('Upgrade request:', { planId, userId: user.id })

    const { data: userPharmacy, error: pharmacyError } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .single()

    if (pharmacyError) {
      console.error('Pharmacy lookup error:', pharmacyError)
      return NextResponse.json({ error: `Pharmacy error: ${pharmacyError.message}` }, { status: 403 })
    }

    if (!userPharmacy) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 403 })
    }

    // Get plan details (case-insensitive)
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .ilike('name', planId)
      .eq('is_active', true)
      .single()

    if (planError) {
      console.error('Plan lookup error:', planError)
      return NextResponse.json({ error: `Plan error: ${planError.message}` }, { status: 404 })
    }

    if (!plan) {
      return NextResponse.json({ error: `Plan "${planId}" not found` }, { status: 404 })
    }

    console.log('Found plan:', plan)

    // Deactivate existing subscriptions
    await supabase
      .from('subscriptions')
      .update({ is_active: false })
      .eq('pharmacy_id', userPharmacy.pharmacy_id)

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

    // Create new subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        pharmacy_id: userPharmacy.pharmacy_id,
        plan_id: plan.id,
        plan: planEnum,
        is_active: plan.price === 0, // Free plans are active immediately
        expires_at: expiresAt.toISOString(),
        payment_method: 'kpay'
      })
      .select()
      .single()

    if (subscriptionError) {
      console.error('Subscription creation error:', subscriptionError)
      return NextResponse.json({ error: `Subscription error: ${subscriptionError.message}` }, { status: 500 })
    }

    await supabase
      .from('pharmacies')
      .update({
        subscription_plan: planEnum,
        subscription_expires_at: expiresAt.toISOString(),
        status:
          plan.price === 0 && subscription.is_active
            ? planEnum === 'trial'
              ? 'trial'
              : 'active'
            : 'trial',
      })
      .eq('id', userPharmacy.pharmacy_id)

    // Link payment transaction if provided
    if (paymentTransactionId) {
      await supabase
        .from('payment_transactions')
        .update({ subscription_id: subscription.id })
        .eq('id', paymentTransactionId)
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
        requiresPayment: plan.price > 0,
        isActive: subscription.is_active,
        expiresAt: subscription.expires_at
      }
    })

  } catch (error: any) {
    console.error('Upgrade route error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
