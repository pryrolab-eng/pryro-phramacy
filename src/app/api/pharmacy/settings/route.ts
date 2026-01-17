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
    return NextResponse.json({
      name: 'Pryrox Pharmacy',
      license: 'PH-2024-001',
      location: 'Kigali, Rwanda',
      phone: '+250788123456',
      email: 'info@pryrox.com',
      subscription: 'standard',
      currency: 'RWF',
      language: 'en'
    })
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
    return NextResponse.json({ success: false, error: 'Failed to update pharmacy info' })
  }
}
