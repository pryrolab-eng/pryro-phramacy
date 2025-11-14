import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        pharmacy_id: body.pharmacy_id || 'userPharmacy.pharmacy_id',
        name: body.name,
        description: body.description,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, category })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add category' }, { status: 500 })
  }
}
