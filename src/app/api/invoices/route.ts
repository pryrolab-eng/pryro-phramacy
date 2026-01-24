import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .single()

    if (!userPharmacy) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 403 })
    }

    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('pharmacy_id', userPharmacy.pharmacy_id)
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: paymentMethod } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('pharmacy_id', userPharmacy.pharmacy_id)
      .eq('is_default', true)
      .single()

    const nextInvoice = invoices?.find(inv => inv.status === 'pending')

    return NextResponse.json({
      nextBilling: nextInvoice?.due_date || null,
      amount: nextInvoice?.amount || 0,
      paymentMethod: paymentMethod?.method_type || 'Not set',
      invoices: invoices?.map(inv => ({
        id: inv.id,
        date: inv.created_at.split('T')[0],
        amount: inv.amount,
        status: inv.status === 'paid' ? 'Paid' : 'Pending'
      })) || []
    })
  } catch (error) {
    console.error('Billing fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch billing' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const receiptNumber = `INV-${Date.now()}`
    
    const { data: invoice, error } = await supabase
      .from('sales')
      .insert({
        pharmacy_id: body.pharmacy_id || 'userPharmacy.pharmacy_id',
        customer_name: body.customer,
        total_amount: body.amount,
        receipt_number: receiptNumber,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, invoice })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}
