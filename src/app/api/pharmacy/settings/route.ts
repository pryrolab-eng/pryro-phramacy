import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .single()

    if (!userPharmacy) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 403 })
    }
    
    const { data: pharmacy, error } = await supabase
      .from('pharmacies')
      .select('*')
      .eq('id', userPharmacy.pharmacy_id)
      .single()
    
    if (error) throw error
    
    return NextResponse.json({
      name: pharmacy.name,
      license: pharmacy.license_number,
      location: `${pharmacy.city}, ${pharmacy.province}`,
      phone: pharmacy.phone,
      email: pharmacy.email,
      subscription: pharmacy.subscription_plan || 'standard',
      currency: 'RWF',
      language: 'en'
    })
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .single()

    if (!userPharmacy) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 403 })
    }

    const body = await request.json()
    
    if (!body.name || !body.phone || !body.email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('pharmacies')
      .update({
        name: body.name,
        phone: body.phone,
        email: body.email,
        city: body.location?.split(',')[0]?.trim(),
        province: body.location?.split(',')[1]?.trim()
      })
      .eq('id', userPharmacy.pharmacy_id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
