import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' })
    }

    // Get user's pharmacy_id
    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .single()

    if (!userPharmacy) {
      return NextResponse.json({ success: false, error: 'Pharmacy not found' })
    }
    
    const body = await request.json()
    
    // First create or find the medication
    let medicationId;
    const { data: existingMed } = await supabase
      .from('medications')
      .select('id')
      .eq('name', body.name)
      .single()

    if (existingMed) {
      medicationId = existingMed.id
    } else {
      const { data: newMed, error: medError } = await supabase
        .from('medications')
        .insert({
          name: body.name,
          category: body.category || 'general',
          generic_name: body.name
        })
        .select('id')
        .single()

      if (medError) throw medError
      medicationId = newMed.id
    }

    // Then create the inventory item
    const { data: inventory, error } = await supabase
      .from('inventory')
      .insert({
        pharmacy_id: userPharmacy.pharmacy_id,
        medication_id: medicationId,
        batch_number: body.batch_number,
        quantity_in_stock: parseInt(body.quantity),
        unit_cost: parseFloat(body.unit_cost),
        selling_price: parseFloat(body.selling_price),
        minimum_stock_level: parseInt(body.minimum_stock_level),
        expiry_date: body.expiry_date
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, inventory })
  } catch (error) {
    console.error('Error adding inventory:', error)
    return NextResponse.json({ success: false, error: 'Failed to add medication' })
  }
}
