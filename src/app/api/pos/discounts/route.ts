import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: discounts, error } = await supabase
      .from('discounts')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    
    // Format for frontend compatibility
    const formattedDiscounts = discounts?.map(d => ({
      id: d.id,
      name: d.name,
      type: d.type,
      value: d.value,
      active: d.is_active
    })) || []

    return NextResponse.json(formattedDiscounts)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch discounts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data: discount, error } = await supabase
      .from('discounts')
      .insert({
        pharmacy_id: body.pharmacy_id || 'userPharmacy.pharmacy_id',
        name: body.name,
        type: body.type,
        value: body.value,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, discount })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create discount' }, { status: 500 })
  }
}
