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

    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .single()

    if (!userPharmacy) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 403 })
    }

    // Get plan details
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single()

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Deactivate existing subscriptions
    await supabase
      .from('subscriptions')
      .update({ is_active: false })
      .eq('pharmacy_id', userPharmacy.pharmacy_id)

    // Calculate expiry date
    const now = new Date()
    const expiresAt = new Date(now)
    
    if (plan.period === 'per month') {
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    } else if (plan.period === 'per year') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 100)
    }

    // Create new subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        pharmacy_id: userPharmacy.pharmacy_id,
        plan_id: plan.id,
        is_active: plan.price === 0, // Free plans are active immediately
        expires_at: expiresAt.toISOString(),
        payment_method: 'kpay'
      })
      .select()
      .single()

    if (subscriptionError) {
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
    }

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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
