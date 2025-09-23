import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // For superadmin, bypass auth and get all pharmacies
    const { data: pharmacies, error } = await supabase
      .from('pharmacies')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json([])
    }

    console.log('Fetched pharmacies:', pharmacies)
    return NextResponse.json(pharmacies || [])
  } catch (error) {
    console.error('Error fetching pharmacies:', error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const body = await request.json()
    
    console.log('Creating pharmacy with data:', body)
    
    // Create pharmacy owner user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: body.owner_email,
      password: body.owner_password,
      email_confirm: true
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ success: false, error: `User creation failed: ${authError.message}` })
    }

    // Create pharmacy
    const { data: pharmacy, error: pharmacyError } = await supabase
      .from('pharmacies')
      .insert({
        name: body.name,
        address: body.address,
        phone: body.phone,
        email: body.owner_email,
        license_number: body.license_number || `LIC-${Date.now()}`,
        subscription_plan: body.subscription_plan === 'free' ? 'trial' : body.subscription_plan,
        status: 'active',
        owner_id: authUser.user.id
      })
      .select()
      .single()

    if (pharmacyError) {
      console.error('Pharmacy creation error:', pharmacyError)
      return NextResponse.json({ success: false, error: `Pharmacy creation failed: ${pharmacyError.message}` })
    }

    // Try to create profile (optional)
    try {
      await supabase.from('profiles').insert({
        id: authUser.user.id,
        full_name: body.owner_name,
        email: body.owner_email,
        phone: body.phone
      })
    } catch (profileError) {
      console.log('Profile creation skipped:', profileError)
    }

    // Try to create pharmacy user relationship (optional)
    try {
      await supabase.from('pharmacy_users').insert({
        user_id: authUser.user.id,
        pharmacy_id: pharmacy.id,
        role: 'owner'
      })
    } catch (pharmacyUserError) {
      console.log('Pharmacy user relationship skipped:', pharmacyUserError)
    }

    return NextResponse.json({ success: true, pharmacy })
  } catch (error) {
    console.error('Error creating pharmacy:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to create pharmacy' })
  }
}