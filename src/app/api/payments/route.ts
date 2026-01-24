import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

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
    const { plan } = body

    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .single()

    if (!userPharmacy) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 403 })
    }

    const planPrices: Record<string, number> = {
      'free': 0,
      'standard': 50000,
      'premium': 120000
    }

    const amount = planPrices[plan?.toLowerCase()] || 0

    const { error: updateError } = await supabase
      .from('pharmacies')
      .update({
        subscription_plan: plan.toLowerCase(),
        subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', userPharmacy.pharmacy_id)

    if (updateError) throw updateError

    const { error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        pharmacy_id: userPharmacy.pharmacy_id,
        amount,
        status: amount === 0 ? 'paid' : 'pending',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        plan_name: plan
      })

    if (invoiceError) throw invoiceError

    return NextResponse.json({ success: true, plan })
  } catch (error) {
    console.error('Payment error:', error)
    return NextResponse.json({ error: 'Payment failed' }, { status: 500 })
  }
}
