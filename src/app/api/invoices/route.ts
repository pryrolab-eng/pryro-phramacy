import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: sales, error } = await supabase
      .from('sales')
      .select('id, customer_name, total_amount, status, receipt_number, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error
    
    // Format as invoices for frontend
    const invoices = sales?.map(s => ({
      id: s.receipt_number || `INV-${s.id.slice(0, 8)}`,
      customer: s.customer_name || 'Walk-in Customer',
      amount: s.total_amount,
      status: s.status === 'completed' ? 'paid' : 'pending',
      date: s.created_at
    })) || []

    return NextResponse.json(invoices)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
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
