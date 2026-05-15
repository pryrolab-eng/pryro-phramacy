import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

/**
 * Creates the tenant pharmacy and attaches the current user as pharmacy_owner.
 * Used during post–sign-up onboarding (step 1).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: existing } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)

    if (existing?.length) {
      return NextResponse.json({
        success: true,
        pharmacyId: existing[0].pharmacy_id,
        alreadyExists: true,
      })
    }

    const body = await request.json()
    const name = (body.name as string)?.trim()
    const license_number = ((body.license_number as string)?.trim() || `LIC-${Date.now()}`).slice(0, 200)
    const city = (body.city as string)?.trim() || 'Kigali'
    const address = (body.address as string)?.trim() || null
    const phone = (body.phone as string)?.trim()
    const email = (body.email as string)?.trim() || user.email || ''

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Pharmacy name and phone are required.' },
        { status: 400 }
      )
    }

    const { data: pharmacy, error: pharmacyError } = await supabase
      .from('pharmacies')
      .insert({
        name,
        license_number,
        owner_id: user.id,
        address,
        phone,
        email,
        city,
        status: 'trial',
        subscription_plan: 'trial',
      })
      .select('id')
      .single()

    if (pharmacyError || !pharmacy) {
      console.error('Onboarding pharmacy insert:', pharmacyError)
      return NextResponse.json(
        { error: pharmacyError?.message || 'Could not create pharmacy.' },
        { status: 400 }
      )
    }

    const { error: memberError } = await supabase.from('pharmacy_users').insert({
      pharmacy_id: pharmacy.id,
      user_id: user.id,
      role: 'pharmacy_owner',
      is_active: true,
    })

    if (memberError) {
      console.error('Onboarding pharmacy_users insert:', memberError)
      return NextResponse.json(
        { error: memberError.message || 'Could not link you to the pharmacy.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      pharmacyId: pharmacy.id,
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
