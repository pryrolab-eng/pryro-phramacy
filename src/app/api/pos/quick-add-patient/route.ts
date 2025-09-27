import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data: customer, error } = await supabase
      .from('customers')
      .insert({
        pharmacy_id: body.pharmacy_id || 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: body.name,
        phone: body.phone,
        insurance: body.insurance_number || 'None'
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, customer })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add patient' }, { status: 500 })
  }
}