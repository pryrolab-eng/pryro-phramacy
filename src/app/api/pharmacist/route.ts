import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ 
        error: 'Missing Supabase credentials',
        details: `URL: ${!!supabaseUrl}, Key: ${!!serviceKey}`
      }, { status: 500 })
    }
    
    // Use admin client for user creation
    const supabase = createClient(
      supabaseUrl,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    
    // Create user with admin method
    const { data, error } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: { full_name: body.full_name }
    })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    if (data.user) {
      // Add to pharmacy_users table
      const { error: dbError } = await supabase
        .from('pharmacy_users')
        .insert({
          pharmacy_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          user_id: data.user.id,
          role: 'pharmacist',
          is_active: true
        })
      
      if (dbError) {
        return NextResponse.json({ error: `Database error: ${dbError.message}` }, { status: 500 })
      }
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Pharmacist created successfully',
      userId: data.user?.id
    })
    
  } catch (error) {
    return NextResponse.json({ 
      error: String(error)
    }, { status: 500 })
  }
}