import { NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    // If no body, create default test users
    if (!body.email) {
      const testUsers = [
        { email: 'pharmacy@test.com', password: 'pharmacy123', role: 'pharmacy_owner' },
        { email: 'pharmacist@test.com', password: 'pharmacist123', role: 'pharmacist' },
        { email: 'cashier@test.com', password: 'cashier123', role: 'cashier' }
      ]

      for (const user of testUsers) {
        const { data, error } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true
        })

        if (data.user && !error) {
          await supabase
            .from('pharmacy_users')
            .upsert({
              pharmacy_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
              user_id: data.user.id,
              role: user.role,
              is_active: true
            })
        }
      }
      return NextResponse.json({ success: true, message: 'Test users created' })
    }
    
    // Create single user from request
    const { email, password, full_name, phone, role, pharmacy_id } = body
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, phone }
    })

    if (data.user && !error) {
      await supabase
        .from('pharmacy_users')
        .upsert({
          pharmacy_id: pharmacy_id || 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          user_id: data.user.id,
          role: role || 'pharmacist',
          is_active: true
        })
    }

    return NextResponse.json({ success: true, message: 'User created successfully' })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}