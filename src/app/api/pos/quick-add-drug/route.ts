import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'
import { requireSessionPharmacyId } from '@/lib/pharmacy/get-session-pharmacy'
import { requireSessionBranchId } from '@/lib/pharmacy/get-session-branch'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)
    const branchId = await requireSessionBranchId(supabase, user.id)

    const body = await request.json()
    console.log('Quick add drug - pharmacy_id:', pharmacyId)
    console.log('Quick add drug - body:', body)
    
    // Add to medications table
    const { data: medication, error: medError } = await supabase
      .from('medications')
      .insert({
        pharmacy_id: pharmacyId,
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
        pharmacy_id: pharmacyId,
        branch_id: branchId,
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
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
