import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: providers, error } = await supabase
      .from('insurance_providers')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return NextResponse.json(providers)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch insurance providers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data: provider, error } = await supabase
      .from('insurance_providers')
      .insert({
        pharmacy_id: body.pharmacy_id || 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: body.name,
        coverage_percentage: body.coverage_percentage || 80,
        contact_email: body.contact_email || '',
        contact_phone: body.contact_phone || '',
        policy_number: body.policy_number || '',
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, provider })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to add insurance provider' }, { status: 500 })
  }
}