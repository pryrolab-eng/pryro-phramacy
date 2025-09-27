import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(suppliers)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .insert({
        name: body.name,
        contact_person: body.contact,
        phone: body.phone,
        email: body.email,
        pharmacy_id: body.pharmacy_id, // This should come from user session
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, supplier })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 })
  }
}