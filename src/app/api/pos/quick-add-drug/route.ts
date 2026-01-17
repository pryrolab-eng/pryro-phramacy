import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's pharmacy_id
    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .single()

    if (!userPharmacy) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 403 })
    }
    
    const body = await request.json()
    console.log('Quick add drug - pharmacy_id:', userPharmacy.pharmacy_id)
    console.log('Quick add drug - body:', body)
    
    // Add to medications table
    const { data: medication, error: medError } = await supabase
      .from('medications')
      .insert({
        pharmacy_id: userPharmacy.pharmacy_id,
        name: body.name,
        category: body.category,
        manufacturer: body.manufacturer,
        barcode: body.barcode
      })
      .select()
      .single()

    if (medError) {
      console.error('Medication insert error:', medError)
      throw medError
    }

    // Add to inventory table
    const { data: inventory, error: invError } = await supabase
      .from('inventory')
      .insert({
        pharmacy_id: userPharmacy.pharmacy_id,
        medication_id: medication.id,
        batch_number: body.batch_number,
        quantity_in_stock: body.initial_stock || 0,
        unit_cost: body.purchase_price || 0,
        selling_price: body.unit_price || 0,
        minimum_stock_level: body.min_stock || 0,
        expiry_date: body.expiry_date
      })
      .select()
      .single()

    if (invError) {
      console.error('Inventory insert error:', invError)
      throw invError
    }
    return NextResponse.json({ success: true, medication, inventory })
  } catch (error) {
    console.error('Quick add drug error:', error)
    return NextResponse.json({ 
      error: 'Failed to add drug', 
      details: error.message 
    }, { status: 500 })
  }
}
