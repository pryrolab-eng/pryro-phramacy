import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    // Use service role for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const body = await request.json()
    
    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      user_metadata: {
        full_name: body.full_name
      }
    })
    
    if (authError) throw authError
    
    // Add to pharmacy_users table
    const { data: pharmacyUser, error: dbError } = await supabase
      .from('pharmacy_users')
      .insert({
        user_id: authUser.user.id,
        pharmacy_id: body.pharmacy_id,
        role: body.role || 'pharmacist',
        display_name: body.full_name,
        email: body.email,
        phone: body.phone,
        is_active: true
      })
      .select()
      .single()
    
    if (dbError) throw dbError
    
    // Add to staff table
    const { error: staffError } = await supabase
      .from('staff')
      .insert({
        pharmacy_id: body.pharmacy_id,
        user_id: authUser.user.id,
        first_name: body.full_name.split(' ')[0],
        last_name: body.full_name.split(' ').slice(1).join(' ') || '',
        email: body.email,
        phone: body.phone,
        position: body.role || 'pharmacist',
        is_active: true
      })
    
    if (staffError) throw staffError
    
    return NextResponse.json({ 
      success: true,
      message: 'Pharmacist created successfully',
      userId: authUser.user.id
    })
    
  } catch (error) {
    return NextResponse.json({ 
      error: error.message || 'Failed to create pharmacist'
    }, { status: 500 })
  }
}