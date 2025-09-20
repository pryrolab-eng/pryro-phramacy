import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    const { data: pharmacies, error } = await supabase
      .from('pharmacies')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(pharmacies || [])
  } catch (error) {
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    // Create pharmacy owner user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: body.owner_email,
      password: body.owner_password,
      email_confirm: true
    })

    if (authError) throw authError

    // Create pharmacy
    const { data: pharmacy, error: pharmacyError } = await supabase
      .from('pharmacies')
      .insert({
        name: body.name,
        address: body.address,
        phone: body.phone,
        email: body.email,
        license_number: body.license_number,
        subscription_plan: body.subscription_plan,
        status: 'active'
      })
      .select()
      .single()

    if (pharmacyError) throw pharmacyError

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        full_name: body.owner_name,
        email: body.owner_email,
        phone: body.phone
      })

    if (profileError) throw profileError

    // Create pharmacy user relationship
    const { error: pharmacyUserError } = await supabase
      .from('pharmacy_users')
      .insert({
        user_id: authUser.user.id,
        pharmacy_id: pharmacy.id,
        role: 'owner'
      })

    if (pharmacyUserError) throw pharmacyUserError

    // Link insurance providers if selected
    if (body.insurance_providers && body.insurance_providers.length > 0) {
      const insuranceLinks = body.insurance_providers.map(insuranceId => ({
        pharmacy_id: pharmacy.id,
        insurance_provider_id: insuranceId
      }))
      
      const { error: insuranceError } = await supabase
        .from('pharmacy_insurance_providers')
        .insert(insuranceLinks)
      
      if (insuranceError) console.error('Insurance linking error:', insuranceError)
    }

    return NextResponse.json({ success: true, pharmacy })
  } catch (error) {
    console.error('Error creating pharmacy:', error)
    return NextResponse.json({ success: false, error: 'Failed to create pharmacy' })
  }
}