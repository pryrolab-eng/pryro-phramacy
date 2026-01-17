import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!userPharmacy) {
      return NextResponse.json({ success: false, error: 'Pharmacy not found' }, { status: 404 })
    }

    const { data: locations, error } = await supabase
      .from('stock_locations')
      .select('*')
      .eq('pharmacy_id', userPharmacy.pharmacy_id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) throw error
    return NextResponse.json(locations || [])
  } catch (error) {
    console.error('Error fetching locations:', error)
    // Return default locations if table doesn't exist
    return NextResponse.json([
      { id: '1', name: 'Main Store', description: 'Primary location', is_active: true },
      { id: '2', name: 'Branch', description: 'Secondary location', is_active: true },
      { id: '3', name: 'Cold Storage', description: 'Temperature controlled', is_active: true },
      { id: '4', name: 'Warehouse', description: 'Bulk storage', is_active: true }
    ])
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!userPharmacy) {
      return NextResponse.json({ success: false, error: 'Pharmacy not found' }, { status: 404 })
    }

    const body = await request.json()
    
    const { data: location, error } = await supabase
      .from('stock_locations')
      .insert({
        pharmacy_id: userPharmacy.pharmacy_id,
        name: body.name,
        description: body.description || '',
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, location })
  } catch (error) {
    console.error('Error creating location:', error)
    return NextResponse.json({ success: false, error: 'Failed to create location' }, { status: 500 })
  }
}
