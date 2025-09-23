import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Get all insurance providers (both global and pharmacy-specific)
    const { data: insurance, error } = await supabase
      .from('insurance_providers')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      // Fallback to default insurance providers
      return NextResponse.json([
        { id: '1', name: 'RSSB', coverage_percentage: 80, is_active: true },
        { id: '2', name: 'MMI', coverage_percentage: 90, is_active: true },
        { id: '3', name: 'Radiant Insurance', coverage_percentage: 85, is_active: true },
        { id: '4', name: 'SONARWA', coverage_percentage: 75, is_active: true }
      ])
    }

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
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const body = await request.json()
    
    const insertData = {
      name: body.name,
      coverage_percentage: body.coverage_percentage,
      contact_email: body.contact_email || null,
      contact_phone: body.contact_phone || null,
      policy_number: body.policy_number || null,
      invoice_template: body.invoice_template || 'default',
      template_config: JSON.stringify({
        html: body.template_html || '',
        variables: ['insurance_name', 'policy_number', 'patient_name', 'date', 'amount', 'coverage_percentage']
      }),
      pharmacy_id: null,
      is_active: true
    }
    
    const { data: insurance, error } = await supabase
      .from('insurance_providers')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message })
    }

    return NextResponse.json({ success: true, insurance })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to add insurance provider' })
  }
}