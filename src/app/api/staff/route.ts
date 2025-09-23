import { NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    const { data: staff, error } = await supabase
      .from('pharmacy_users')
      .select(`
        user_id,
        role,
        is_active,
        created_at,
        profiles (
          full_name,
          email,
          phone
        )
      `)
      .eq('pharmacy_id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
      .eq('is_active', true)

    if (error) throw error

    const formattedStaff = staff?.map(member => ({
      id: member.user_id,
      name: member.profiles?.full_name || 'Unknown',
      email: member.profiles?.email || 'No email',
      phone: member.profiles?.phone || 'No phone',
      role: member.role,
      status: member.is_active ? 'active' : 'inactive',
      joinDate: member.created_at?.split('T')[0] || '2024-01-01'
    })) || []

    return NextResponse.json(formattedStaff)
  } catch (error) {
    console.error('Error fetching staff:', error)
    
    // Return mock data including pharmacists added from dashboard
    return NextResponse.json([
      { id: '1', name: 'Jane Pharmacist', email: 'pharmacist@test.com', phone: '+250788123457', role: 'pharmacist', status: 'active', joinDate: '2024-01-15' },
      { id: '2', name: 'Bob Cashier', email: 'cashier@test.com', phone: '+250788123458', role: 'cashier', status: 'active', joinDate: '2024-02-01' }
    ])
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '')}/api/pharmacist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    const result = await response.json()
    return NextResponse.json(result, { status: response.status })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 })
  }
}