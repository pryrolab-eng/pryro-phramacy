import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: branches, error } = await supabase
      .from('branches')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    // Format for frontend compatibility
    const formattedBranches = branches?.map(b => ({
      id: b.id,
      name: b.name,
      location: b.address,
      manager: b.manager_id, // You may want to join with users table
      phone: b.phone,
      email: b.phone, // branches table doesn't have email
      status: b.is_active ? 'active' : 'inactive',
      staff_count: 0, // Calculate from staff table if needed
      monthly_sales: 0, // Calculate from sales table if needed
      created_at: b.created_at
    })) || []

    return NextResponse.json(formattedBranches)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data: branch, error } = await supabase
      .from('branches')
      .insert({
        pharmacy_id: body.pharmacy_id || 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: body.name,
        address: body.location,
        phone: body.phone,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, branch })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create branch' }, { status: 500 })
  }
}