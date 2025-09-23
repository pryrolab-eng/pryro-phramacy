import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    const { data: branch, error } = await supabase
      .from('branches')
      .update({
        name: body.name,
        address: body.address,
        phone: body.phone,
        manager_name: body.manager_name,
        is_main: body.is_main,
        is_active: body.is_active
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(branch)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update branch' }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('branch_id', params.id)
      .order('name')

    if (error) throw error

    return NextResponse.json(inventory || [])
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch branch inventory' }, { status: 500 })
  }
}