import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'
import { requireSessionPharmacyId } from '@/lib/pharmacy/get-session-pharmacy'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    
    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)

    const customerData = {
      pharmacy_id: pharmacyId,
      name: body.patientName || body.name || '',
      phone: body.phoneNumber || body.phone || '',
      insurance_number: body.insuranceNumber || ''
    }
    
    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single()
    
    if (error) {
      console.error('Database error:', error)
      throw error
    }
    
    return NextResponse.json({ 
      success: true, 
      customer: {
        id: newCustomer.id,
        name: newCustomer.name,
        phone: newCustomer.phone,
        insurance_number: newCustomer.insurance_number
      }
    })
  } catch (error) {
    console.error('Quick add patient error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to add patient',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}