import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    // Use service role for all operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const body = await request.json()
    
    // Get first available pharmacy if no pharmacy_id provided
    let targetPharmacyId = body.pharmacy_id
    if (!targetPharmacyId) {
      const { data: firstPharmacy } = await supabase
        .from('pharmacies')
        .select('id')
        .limit(1)
        .single()
      targetPharmacyId = firstPharmacy?.id
    }
    
    if (!targetPharmacyId) {
      return NextResponse.json({ error: 'No pharmacy found' }, { status: 400 })
    }
    
    // Create user in Supabase Auth
    const { data: authUser, error: createUserError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        full_name: body.full_name,
        phone: body.phone
      }
    })
    
    if (createUserError) throw createUserError
    
    // Add to pharmacy_users table
    const { data: newUser, error: dbError } = await supabase
      .from('pharmacy_users')
      .insert({
        pharmacy_id: targetPharmacyId,
        user_id: authUser.user.id,
        role: body.role || 'pharmacist'
      })
      .select()
      .single()
    
    if (dbError) throw dbError
    
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
