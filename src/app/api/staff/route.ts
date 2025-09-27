import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: staff, error } = await supabase
      .from('staff')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    // Format for frontend compatibility
    const formattedStaff = staff?.map(s => ({
      id: s.id,
      name: `${s.first_name} ${s.last_name}`,
      email: s.email,
      phone: s.phone,
      role: s.position,
      status: s.is_active ? 'active' : 'inactive',
      branch: s.department || 'Main Branch',
      joinDate: s.hire_date
    })) || []

    return NextResponse.json(formattedStaff)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data: staffMember, error } = await supabase
      .from('staff')
      .insert({
        pharmacy_id: body.pharmacy_id || 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        first_name: body.name.split(' ')[0],
        last_name: body.name.split(' ').slice(1).join(' ') || '',
        email: body.email,
        phone: body.phone,
        position: body.role,
        department: body.branch || 'Main Branch',
        hire_date: new Date().toISOString().split('T')[0],
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, staff: staffMember })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create staff member' }, { status: 500 })
  }
}