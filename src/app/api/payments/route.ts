import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'
import { createServiceClient } from '../../../../supabase/service'
import { resolveActivePharmacyContext } from '@/lib/pharmacy/active-pharmacy'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: sales, error } = await supabase
      .from('sales')
      .select('id, total_amount, payment_method, status, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error
    
    // Format as payments for frontend
    const payments = sales?.map(s => ({
      id: s.id,
      amount: s.total_amount,
      method: s.payment_method,
      status: s.status === 'completed' ? 'completed' : 'pending',
      date: s.created_at
    })) || []

    return NextResponse.json(payments)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
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
    const { plan, useKPay = false } = body

    const admin = createServiceClient()
    const ctx = await resolveActivePharmacyContext(admin, user.id)

    if (!ctx.activePharmacyId) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 403 })
    }

    if (!['pharmacy_owner', 'admin'].includes(ctx.role ?? '')) {
      return NextResponse.json({ error: 'Only pharmacy owners can manage subscriptions' }, { status: 403 })
    }

    const pharmacyId = ctx.activePharmacyId

    const planPrices: Record<string, number> = {
      'trial': 0,
      'standard': 50000,
      'premium': 120000
    }

    const planMap: Record<string, string> = {
      'free': 'trial',
      'standard': 'standard',
      'premium': 'premium'
    }

    const dbPlan = planMap[plan?.toLowerCase()] || 'trial'
    const amount = planPrices[dbPlan] || 0

    // If amount is 0 or not using KPay, process immediately
    if (amount === 0 || !useKPay) {
      const { error: updateError } = await supabase
        .from('pharmacies')
        .update({
          subscription_plan: dbPlan,
          subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', pharmacyId)

      if (updateError) throw updateError

      const { error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          pharmacy_id: pharmacyId,
          amount,
          status: amount === 0 ? 'paid' : 'pending',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          plan_name: plan
        })

      if (invoiceError) throw invoiceError

      return NextResponse.json({ success: true, plan })
    }

    // Create subscription record for KPay payment
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        pharmacy_id: pharmacyId,
        plan: dbPlan,
        amount,
        is_active: false,
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single()

    if (subError) throw subError

    // Return subscription ID for KPay payment
    return NextResponse.json({ 
      success: true, 
      plan,
      requiresPayment: true,
      subscriptionId: subscription.id,
      amount
    })
  } catch (error) {
    console.error('Payment error:', error)
    return NextResponse.json({ error: 'Payment failed' }, { status: 500 })
  }
}
