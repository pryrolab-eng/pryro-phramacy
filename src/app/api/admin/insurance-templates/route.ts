import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: templates, error } = await supabase
      .from('insurance_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(templates || [])
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data: template, error } = await supabase
      .from('insurance_templates')
      .insert({
        pharmacy_id: body.pharmacy_id || 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: body.name,
        insurance_provider: body.insurance_provider,
        template_html: body.template_html,
        template_css: body.template_css,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, template })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}