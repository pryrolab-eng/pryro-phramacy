import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'
import { createServiceClient } from '../../../../../supabase/service'
import { createSubscriptionUpgrade } from '@/lib/subscription/create-pending-upgrade'
import { getScheduledSubscriptionChange } from '@/lib/subscription/get-scheduled-change'
import { SubscriptionPlanChangeError } from '@/lib/subscription/validate-upgrade'
import { SUBSCRIPTION_CURRENT_PLAN_EMBED } from '@/lib/subscription/embed-plan'
import { resolveActivePharmacyId } from '@/lib/pharmacy/active-pharmacy'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createServiceClient()
    const pharmacyId = await resolveActivePharmacyId(admin, user.id)
    if (!pharmacyId) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 403 })
    }

    // Get current subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(`
        *,
        ${SUBSCRIPTION_CURRENT_PLAN_EMBED} (
          id,
          name,
          price,
          period,
          features
        )
      `)
      .eq('pharmacy_id', pharmacyId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const scheduled = await getScheduledSubscriptionChange(
      admin,
      pharmacyId
    )

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
        expiresAt: null,
        scheduledChange: scheduled
          ? {
              status: scheduled.status,
              effectiveAt: scheduled.effectiveAt,
              changeType: scheduled.changeType,
              targetPlan: scheduled.targetPlan,
              currentPlan: scheduled.currentPlan,
            }
          : null,
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
      .eq('pharmacy_id', pharmacyId)
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
      },
      scheduledChange: scheduled
        ? {
            status: scheduled.status,
            effectiveAt: scheduled.effectiveAt,
            changeType: scheduled.changeType,
            targetPlan: scheduled.targetPlan,
            currentPlan: scheduled.currentPlan,
          }
        : null,
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

    const admin = createServiceClient()
    const pharmacyId = await resolveActivePharmacyId(admin, user.id)
    if (!pharmacyId) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 403 })
    }

    const { data: plan } = await admin
      .from('subscription_plans')
      .select('*')
      .eq('name', planId)
      .eq('is_active', true)
      .maybeSingle()

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const result = await createSubscriptionUpgrade(admin, pharmacyId, {
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

  } catch (error: unknown) {
    if (error instanceof SubscriptionPlanChangeError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      )
    }
    const message = error instanceof Error ? error.message : 'Request failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}