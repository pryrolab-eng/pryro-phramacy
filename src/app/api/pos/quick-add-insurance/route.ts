import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data: insurance, error } = await supabase
      .from('insurance_providers')
      .insert({
        pharmacy_id: body.pharmacy_id || 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: body.name,
        coverage_percentage: body.coverage_percentage || 80,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, insurance })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add insurance' }, { status: 500 })
  }
}