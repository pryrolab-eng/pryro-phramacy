import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    const { data: branches, error } = await supabase
      .from('branches')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(branches || [])
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    const { data: branch, error } = await supabase
      .from('branches')
      .insert([{
        name: body.name,
        code: body.code,
        address: body.address,
        phone: body.phone,
        manager_name: body.manager_name,
        is_main: body.is_main,
        pharmacy_id: body.pharmacy_id
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(branch)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create branch' }, { status: 500 })
  }
}