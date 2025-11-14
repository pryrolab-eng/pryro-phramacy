import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data: returnRecord, error } = await supabase
      .from('returns')
      .insert({
        pharmacy_id: body.pharmacy_id || 'userPharmacy.pharmacy_id',
        sale_id: body.sale_id,
        reason: body.reason,
        refund_amount: body.refund_amount,
        status: 'processed'
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, return: returnRecord })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process return' }, { status: 500 })
  }
}
