import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: pharmacies, error } = await supabase
      .from('pharmacies')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    
    // Format for frontend compatibility
    const formattedPharmacies = pharmacies?.map(p => ({
      id: p.id,
      name: p.name,
      address: p.address,
      phone: p.phone,
      email: p.email,
      subscription_plan: p.subscription_plan,
      owner_name: p.owner_id, // You may want to join with users table
      status: p.status,
      created_at: p.created_at
    })) || []

    return NextResponse.json(formattedPharmacies)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch pharmacies' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data: pharmacy, error } = await supabase
      .from('pharmacies')
      .insert({
        name: body.name,
        address: body.location,
        phone: body.owner_phone,
        email: body.owner_email,
        subscription_plan: body.plan,
        license_number: `LIC-${Date.now()}`,
        status: 'active'
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, pharmacy })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create pharmacy' }, { status: 500 })
  }
}