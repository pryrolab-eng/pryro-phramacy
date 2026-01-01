import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Use service role key for admin operations
    const adminSupabase = createClient()
    
    // Add user to test pharmacy
    const { error: pharmacyUserError } = await adminSupabase
      .from('pharmacy_users')
      .upsert({
        pharmacy_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        user_id: '48fa73ee-1a11-475d-bdc6-8785f69d1954',
        role: 'pharmacy_owner',
        is_active: true
      })

    // Add test medication
    const { error: medError } = await adminSupabase
      .from('medications')
      .upsert({
        id: 'med-test-001',
        pharmacy_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: 'Test Paracetamol 500mg',
        category: 'otc',
        requires_prescription: false,
        is_active: true
      })

    // Add test inventory
    const { error: invError } = await adminSupabase
      .from('inventory')
      .upsert({
        pharmacy_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        medication_id: 'med-test-001',
        batch_number: 'TEST001',
        quantity_in_stock: 100,
        unit_cost: 400,
        selling_price: 500,
        minimum_stock_level: 20,
        expiry_date: '2025-12-31'
      })

    return NextResponse.json({ 
      success: true, 
      message: 'Fixed user pharmacy access and added test data',
      errors: {
        pharmacy: pharmacyUserError?.message,
        medication: medError?.message,
        inventory: invError?.message
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    })
  }
}