import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'
import { createServiceClient } from '../../../../../supabase/service'
import { createSubscriptionUpgrade } from '@/lib/subscription/create-pending-upgrade'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's pharmacy
    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .single()

    if (!userPharmacy) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 403 })
    }

    // Get current subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(`
        *,
        subscription_plans (
          name,
          price,
          period,
          features
        )
      `)
      .eq('pharmacy_id', userPharmacy.pharmacy_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!subscription) {
      // Default to free plan
      return NextResponse.json({
        status: 'free',
        plan: {
          name: 'Free',
          price: 0,
          period: 'forever',
          features: ['Basic POS', 'Up to 3 users', 'Email support']
        },
        daysRemaining: null,
        isActive: true,
        expiresAt: null
      })
    }

    // Calculate time remaining
    const now = new Date()
    const expiresAt = new Date(subscription.expires_at)
    const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const isExpired = daysRemaining <= 0

    // Check for recent payments
    const { data: recentPayments } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('pharmacy_id', userPharmacy.pharmacy_id)
      .eq('subscription_id', subscription.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      status: isExpired ? 'expired' : 'active',
      plan: subscription.subscription_plans,
      daysRemaining: Math.max(0, daysRemaining),
      isActive: subscription.is_active && !isExpired,
      expiresAt: subscription.expires_at,
      subscription: {
        id: subscription.id,
        startedAt: subscription.created_at,
        lastPayment: recentPayments?.[0]?.created_at || null,
        paymentHistory: recentPayments?.length || 0
      },
      timeCounter: {
        days: Math.max(0, daysRemaining),
        hours: Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)) % 24),
        minutes: Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60)) % 60),
        isExpiring: daysRemaining <= 7 && daysRemaining > 0,
        isExpired: isExpired
      }
    })

  } catch (error: any) {
    console.error('Subscription status error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { planId } = body

    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .single()

    if (!userPharmacy) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 403 })
    }

    const admin = createServiceClient()
    const { data: plan } = await admin
      .from('subscription_plans')
      .select('*')
      .eq('name', planId)
      .eq('is_active', true)
      .maybeSingle()

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const result = await createSubscriptionUpgrade(admin, userPharmacy.pharmacy_id, {
      id: plan.id as string,
      name: String(plan.name),
      price: plan.price,
      period: plan.period as string | null,
    })

    return NextResponse.json({
      success: true,
      subscription: {
        id: result.id,
        planId: result.planId,
        planName: result.planName,
        amount: result.amount,
        requiresPayment: result.requiresPayment,
      },
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}