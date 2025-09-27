import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    // Add to medications table
    const { data: medication, error: medError } = await supabase
      .from('medications')
      .insert({
        pharmacy_id: body.pharmacy_id || 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: body.name,
        category: body.category,
        manufacturer: body.manufacturer,
        barcode: body.barcode
      })
      .select()
      .single()

    if (medError) throw medError

    // Add to inventory table
    const { data: inventory, error: invError } = await supabase
      .from('inventory')
      .insert({
        pharmacy_id: body.pharmacy_id || 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
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

    if (invError) throw invError
    return NextResponse.json({ success: true, medication, inventory })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add drug' }, { status: 500 })
  }
}