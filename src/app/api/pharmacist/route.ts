import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    // First check if user is authenticated and authorized
    const userSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    userSupabase.auth.setSession({ access_token: authHeader.replace('Bearer ', ''), refresh_token: '' })
    const { data: { user }, error: authError } = await userSupabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user is pharmacy owner or superadmin
    const { data: pharmacyUser } = await userSupabase
      .from('users')
      .select('role, pharmacy_id')
      .eq('id', user.id)
      .single()
    
    const isSuperAdmin = user.email === 'abdousentore@gmail.com'
    const isPharmacyOwner = pharmacyUser?.role === 'pharmacy_owner'
    
    if (!isSuperAdmin && !isPharmacyOwner) {
      return NextResponse.json({ error: 'Only pharmacy owners can add pharmacists' }, { status: 403 })
    }
    
    // Use service role for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const body = await request.json()
    
    // Use the user's pharmacy_id if they're a pharmacy owner
    const targetPharmacyId = isPharmacyOwner ? pharmacyUser.pharmacy_id : body.pharmacy_id
    
    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      user_metadata: {
        full_name: body.full_name
      }
    })
    
    if (authError) throw authError
    
    // Add to users table
    const { data: pharmacyUser, error: dbError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        pharmacy_id: targetPharmacyId,
        role: body.role || 'pharmacist',
        full_name: body.full_name,
        email: body.email,
        phone: body.phone
      })
      .select()
      .single()
    
    if (dbError) throw dbError
    
    // Add to staff table
    const { error: staffError } = await supabase
      .from('staff')
      .insert({
        pharmacy_id: targetPharmacyId,
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