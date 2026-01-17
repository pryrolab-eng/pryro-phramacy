import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.log('No authenticated user')
      return NextResponse.json([])
    }

    const { data: userPharmacy, error: pharmacyError } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (pharmacyError || !userPharmacy) {
      console.error('Pharmacy not found for user:', user.id, pharmacyError)
      return NextResponse.json([])
    }

    console.log('Fetching inventory for pharmacy:', userPharmacy.pharmacy_id)
    
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select(`
        id,
        pharmacy_id,
        batch_number,
        quantity_in_stock,
        selling_price,
        minimum_stock_level,
        expiry_date,
        unit_cost,
        medications!inner (
          name,
          category,
          pharmacy_id
        )
      `)
      .eq('pharmacy_id', userPharmacy.pharmacy_id)
      .eq('medications.pharmacy_id', userPharmacy.pharmacy_id)

    if (error) {
      console.error('Error fetching inventory:', error)
      throw error
    }

    console.log(`Found ${inventory?.length || 0} inventory items for pharmacy ${userPharmacy.pharmacy_id}`)

    const formattedInventory = inventory?.map(item => ({
      id: item.id,
      name: item.medications?.name || 'Unknown',
      category: item.medications?.category || 'general',
      stock: item.quantity_in_stock,
      minStock: item.minimum_stock_level,
      price: item.selling_price,
      expiryDate: item.expiry_date,
      batchNumber: item.batch_number,
      medications: item.medications,
      pharmacy_id: item.pharmacy_id
    })) || []

    return NextResponse.json(formattedInventory)
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' })
    }

    const { data: userPharmacy, error: pharmacyError } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (pharmacyError || !userPharmacy) {
      console.error('Pharmacy not found for user:', user.id, pharmacyError)
      return NextResponse.json({ success: false, error: 'Pharmacy not found' })
    }
    
    const body = await request.json()
    console.log('Creating inventory for pharmacy:', userPharmacy.pharmacy_id)
    
    const { data: inventory, error } = await supabase
      .from('inventory')
      .insert({
        pharmacy_id: userPharmacy.pharmacy_id,
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

    if (error) {
      console.error('Error creating inventory:', error)
      throw error
    }

    console.log('Successfully created inventory item:', inventory.id)
    return NextResponse.json({ success: true, inventory })
  } catch (error) {
    console.error('Error adding inventory:', error)
    return NextResponse.json({ success: false, error: 'Failed to add inventory item' })
  }
}
