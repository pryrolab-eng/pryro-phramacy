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
    console.log('Received data:', body)
    
    // Map category to enum value
    const categoryMap = {
      'Pain Relief': 'otc',
      'Antibiotics': 'prescription', 
      'Vitamins': 'supplement',
      'Prescription': 'prescription',
      'OTC': 'otc',
      'Controlled': 'controlled',
      'Medical Device': 'medical_device',
      'general': 'otc'
    }
    
    const categoryEnum = categoryMap[body.category] || 'otc'
    
    // First create or find the medication
    let medicationId;
    const { data: existingMed } = await supabase
      .from('medications')
      .select('id')
      .eq('name', body.name)
      .eq('pharmacy_id', userPharmacy.pharmacy_id)
      .single()

    if (existingMed) {
      medicationId = existingMed.id
    } else {
      const { data: newMed, error: medError } = await supabase
        .from('medications')
        .insert({
          name: body.name,
          category: categoryEnum,
          requires_prescription: categoryEnum === 'prescription',
          is_active: true,
          pharmacy_id: userPharmacy.pharmacy_id
        })
        .select('id')
        .single()

      if (medError) {
        console.error('Medication insert error:', medError)
        throw medError
      }
      medicationId = newMed.id
    }

    // Then create the inventory item
    const { data: inventory, error } = await supabase
      .from('inventory')
      .insert({
        pharmacy_id: userPharmacy.pharmacy_id,
        medication_id: medicationId,
        batch_number: body.batch_number || 'BATCH001',
        quantity_in_stock: parseInt(body.quantity) || 0,
        unit_cost: parseFloat(body.unit_cost) || 0,
        selling_price: parseFloat(body.selling_price) || 0,
        minimum_stock_level: parseInt(body.minimum_stock_level) || 0,
        expiry_date: body.expiry_date || '2025-12-31'
      })
      .select()
      .single()

    if (error) {
      console.error('Inventory insert error:', error)
      throw error
    }

    console.log('Successfully added inventory:', inventory)
    return NextResponse.json({ success: true, inventory })
  } catch (error) {
    console.error('Error adding inventory:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to add medication',
      details: error.message 
    })
  }
}