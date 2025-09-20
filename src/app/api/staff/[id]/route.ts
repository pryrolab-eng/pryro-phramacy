import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    // Update users table
    const { error: userError } = await supabase
      .from('users')
      .update({
        name: body.name,
        full_name: body.name,
        phone: body.phone
      })
      .eq('id', params.id)

    if (userError) throw userError

    // Update role in pharmacy_users
    const { error: roleError } = await supabase
      .from('pharmacy_users')
      .update({
        role: body.role
      })
      .eq('user_id', params.id)

    if (roleError) throw roleError

    // Update password if provided
    if (body.password && body.password.trim()) {
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
      
      const { error: passwordError } = await adminSupabase.auth.admin.updateUserById(
        params.id,
        { password: body.password }
      )
      
      if (passwordError) {
        console.error('Password update error:', passwordError)
        return NextResponse.json({ success: false, error: 'Failed to update password' })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating staff:', error)
    return NextResponse.json({ success: false, error: 'Failed to update staff member' })
  }
}