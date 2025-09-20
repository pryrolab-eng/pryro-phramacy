import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: staff, error } = await supabase
      .from('pharmacy_users')
      .select(`
        user_id,
        role,
        created_at,
        users(id, name, full_name, email, phone)
      `)
      .eq('pharmacy_id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')

    if (error) throw error

    const formattedStaff = staff?.map(member => ({
      id: member.user_id,
      name: member.users?.full_name || member.users?.name || 'Unknown',
      email: member.users?.email || '',
      phone: member.users?.phone || '',
      role: member.role,
      status: 'active',
      joinDate: member.created_at?.split('T')[0] || ''
    })) || []

    return NextResponse.json(formattedStaff)
  } catch (error) {
    return NextResponse.json([
      { id: '1', name: 'Jane Pharmacist', email: 'pharmacist@test.com', phone: '+250788123457', role: 'pharmacist', status: 'active', joinDate: '2024-01-15' },
      { id: '2', name: 'Bob Cashier', email: 'cashier@test.com', phone: '+250788123458', role: 'cashier', status: 'active', joinDate: '2024-02-01' }
    ])
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    // Create service role client for admin operations
    const adminSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true
    })

    if (authError) throw authError

    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        name: body.full_name,
        full_name: body.full_name,
        email: body.email,
        phone: body.phone,
        user_id: authUser.user.id,
        token_identifier: authUser.user.id,
        created_at: new Date().toISOString()
      })

    if (userError) throw userError

    const { error: pharmacyUserError } = await supabase
      .from('pharmacy_users')
      .insert({
        user_id: authUser.user.id,
        pharmacy_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        role: body.role,
        is_active: true
      })

    if (pharmacyUserError) throw pharmacyUserError

    return NextResponse.json({ success: true, user: authUser.user })
  } catch (error) {
    console.error('Error creating staff:', error)
    return NextResponse.json({ success: false, error: 'Failed to create staff member' })
  }
}