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
    const body = await request.json()
    
    // Create a payment record as a sale
    const { data: payment, error } = await supabase
      .from('sales')
      .insert({
        pharmacy_id: body.pharmacy_id || 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        total_amount: body.amount,
        payment_method: body.method,
        status: 'completed',
        customer_name: body.customer || 'Walk-in Customer'
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, payment })
  } catch (error) {
    return NextResponse.json({ error: 'Payment failed' }, { status: 500 })
  }
}