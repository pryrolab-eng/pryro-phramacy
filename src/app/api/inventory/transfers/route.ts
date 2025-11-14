import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: transfers, error } = await supabase
      .from('inventory_transfers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    
    // Format for frontend compatibility
    const formattedTransfers = transfers?.map(t => ({
      id: t.id,
      product: t.medication_name,
      quantity: t.quantity,
      from: t.from_branch_id,
      to: t.to_branch_id,
      status: t.status,
      date: t.created_at
    })) || []

    return NextResponse.json(formattedTransfers)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transfers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data: transfer, error } = await supabase
      .from('inventory_transfers')
      .insert({
        pharmacy_id: body.pharmacy_id || 'userPharmacy.pharmacy_id',
        medication_name: body.product,
        quantity: body.quantity,
        from_branch_id: body.from,
        to_branch_id: body.to,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, transfer })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create transfer' }, { status: 500 })
  }
}
