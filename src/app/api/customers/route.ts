import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim() || ''
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return NextResponse.json([])
    
    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .single()
    
    if (!userPharmacy) return NextResponse.json([])
    
    let customersQuery = supabase
      .from('customers')
      .select('*')
      .eq('pharmacy_id', userPharmacy.pharmacy_id)
      
    if (query.length > 0) {
      customersQuery = customersQuery.or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
      const { data: customers } = await customersQuery.limit(5)
      
      const filteredCustomers = (customers || []).map(c => ({ 
        id: c.id, 
        name: c.name, 
        phone: c.phone, 
        insurance_number: c.insurance_number 
      }))
      
      return NextResponse.json(filteredCustomers)
    }
    
    const { data: customers } = await customersQuery
    const formattedCustomers = (customers || []).map(c => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      dateOfBirth: c.date_of_birth || '',
      allergies: c.allergies ? c.allergies.join(', ') : 'None',
      insurance: c.insurance_number || '',
      totalPurchases: 0,
      lastVisit: c.created_at?.split('T')[0] || '',
      status: 'active'
    }))
    
    return NextResponse.json(formattedCustomers)
  } catch (error) {
    console.error('Customer fetch error:', error)
    return NextResponse.json([])
  }
}

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
      name: body.name || body.patientName || '',
      phone: body.phone || body.phoneNumber || '',
      email: body.email || '',
      insurance_number: body.insurance || body.insuranceNumber || ''
    }
    
    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single()
    
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    
    return NextResponse.json({ 
      success: true, 
      customer: {
        id: newCustomer.id,
        name: newCustomer.name,
        phone: newCustomer.phone,
        insurance_number: newCustomer.insurance_number
      },
      message: 'Customer added to database successfully'
    })
  } catch (error) {
    console.error('Customer add error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to add customer'
    }, { status: 500 })
  }
}
