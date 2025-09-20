import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    const { data: insurance, error } = await supabase
      .from('insurance_providers')
      .select('*')
      .order('name')

    if (error) throw error

    return NextResponse.json(insurance || [])
  } catch (error) {
    return NextResponse.json([
      { id: '1', name: 'RSSB', coverage_percentage: 80, is_active: true },
      { id: '2', name: 'MMI', coverage_percentage: 90, is_active: true }
    ])
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    const { data: insurance, error } = await supabase
      .from('insurance_providers')
      .insert({
        name: body.name,
        coverage_percentage: body.coverage_percentage,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, insurance })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to add insurance provider' }, { status: 500 })
  }
}