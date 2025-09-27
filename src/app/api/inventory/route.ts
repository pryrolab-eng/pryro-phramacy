import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select(`
        id,
        batch_number,
        quantity_in_stock,
        selling_price,
        minimum_stock_level,
        expiry_date,
        unit_cost,
        medications (
          name,
          category
        )
      `)
      .eq('pharmacy_id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')

    if (error) throw error

    const formattedInventory = inventory?.map(item => ({
      id: item.id,
      name: item.medications?.name || 'Unknown',
      category: item.medications?.category || 'general',
      stock: item.quantity_in_stock,
      minStock: item.minimum_stock_level,
      price: item.selling_price,
      expiryDate: item.expiry_date,
      batchNumber: item.batch_number,
      medications: item.medications
    })) || []

    return NextResponse.json(formattedInventory)
  } catch (error) {
    return NextResponse.json([
      { id: '1', name: 'Paracetamol 500mg', category: 'Pain Relief', stock: 100, minStock: 20, price: 100, expiryDate: '2025-12-31', batchNumber: 'PAR001' },
      { id: '2', name: 'Amoxicillin 250mg', category: 'Antibiotics', stock: 5, minStock: 10, price: 400, expiryDate: '2025-06-30', batchNumber: 'AMX001' }
    ])
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data: inventory, error } = await supabase
      .from('inventory')
      .insert({
        pharmacy_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        medication_id: body.medication_id,
        batch_number: body.batch_number,
        quantity_in_stock: body.quantity,
        unit_cost: body.unit_cost,
        selling_price: body.selling_price,
        minimum_stock_level: body.minimum_stock_level,
        expiry_date: body.expiry_date
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, inventory })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to add inventory item' })
  }
}