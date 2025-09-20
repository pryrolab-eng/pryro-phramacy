import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    const { data: pharmacy, error } = await supabase
      .from('pharmacies')
      .select('*')
      .eq('id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
      .single()

    if (error) throw error

    return NextResponse.json({
      name: pharmacy?.name || 'Test Pharmacy',
      license: pharmacy?.license_number || 'LIC-TEST-001',
      location: pharmacy?.address || 'Kigali, Rwanda',
      phone: pharmacy?.phone || '+250788123456',
      email: pharmacy?.email || 'test@pharmacy.com',
      subscription: pharmacy?.subscription_plan || 'standard'
    })
  } catch (error) {
    return NextResponse.json({
      name: 'Test Pharmacy',
      license: 'LIC-TEST-001',
      location: 'Kigali, Rwanda',
      phone: '+250788123456',
      email: 'test@pharmacy.com',
      subscription: 'standard'
    })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('pharmacies')
      .update({
        name: body.name,
        phone: body.phone,
        email: body.email,
        address: body.location
      })
      .eq('id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update pharmacy info' })
  }
}