import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    
    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .single()
    
    if (!userPharmacy) return NextResponse.json({ success: false, error: 'Pharmacy not found' }, { status: 404 })
    
    const customerData = {
      pharmacy_id: userPharmacy.pharmacy_id,
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
      details: error.message
    }, { status: 500 })
  }
}