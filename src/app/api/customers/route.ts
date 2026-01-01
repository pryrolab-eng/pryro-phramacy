import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

// Fallback in-memory storage when database is not available
let fallbackCustomers = [
  { id: '1', name: 'Marie Uwimana', phone: '+250788123456', email: 'marie@email.com', dateOfBirth: '1985-03-15', allergies: 'Penicillin', insurance: 'RSSB', totalPurchases: 45000, lastVisit: '2024-12-01', status: 'active' },
  { id: '2', name: 'Jean Baptiste', phone: '+250788123457', email: 'jean@email.com', dateOfBirth: '1978-07-22', allergies: 'None', insurance: 'MMI', totalPurchases: 23000, lastVisit: '2024-11-28', status: 'active' }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim() || ''
    
    // Try database first
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: userPharmacy } = await supabase
          .from('pharmacy_users')
          .select('pharmacy_id')
          .eq('user_id', user.id)
          .single()
        
        if (userPharmacy) {
          let customersQuery = supabase
            .from('customers')
            .select('id, name, phone, email, date_of_birth, allergies, insurance_provider, total_purchases, last_visit, status')
            .eq('pharmacy_id', userPharmacy.pharmacy_id)
          
          if (query.length > 0) {
            customersQuery = customersQuery.or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
            const { data: customers } = await customersQuery.limit(5)
            
            const filteredCustomers = (customers || []).map(c => ({ 
              id: c.id, 
              name: c.name, 
              phone: c.phone, 
              insurance_number: c.insurance_provider 
            }))
            
            return NextResponse.json(filteredCustomers)
          }
          
          const { data: customers } = await customersQuery
          const formattedCustomers = (customers || []).map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            email: c.email,
            dateOfBirth: c.date_of_birth,
            allergies: c.allergies,
            insurance: c.insurance_provider,
            totalPurchases: c.total_purchases || 0,
            lastVisit: c.last_visit,
            status: c.status
          }))
          
          return NextResponse.json(formattedCustomers)
        }
      }
    } catch (dbError) {
      console.log('Database unavailable, using fallback storage')
    }
    
    // Fallback to in-memory storage
    if (query.length > 0) {
      const filteredCustomers = fallbackCustomers.filter(customer => {
        const nameMatch = customer.name.toLowerCase().includes(query.toLowerCase())
        const phoneMatch = customer.phone.replace(/[^0-9]/g, '').includes(query.replace(/[^0-9]/g, ''))
        return nameMatch || phoneMatch
      }).map(c => ({ id: c.id, name: c.name, phone: c.phone, insurance_number: c.insurance }))
      
      return NextResponse.json(filteredCustomers.slice(0, 5))
    }
    
    return NextResponse.json(fallbackCustomers)
  } catch (error) {
    console.error('Customer fetch error:', error)
    return NextResponse.json(fallbackCustomers)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Try database first
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: userPharmacy } = await supabase
          .from('pharmacy_users')
          .select('pharmacy_id')
          .eq('user_id', user.id)
          .single()
        
        if (userPharmacy) {
          const customerData = {
            pharmacy_id: userPharmacy.pharmacy_id,
            name: body.name || body.patientName || '',
            phone: body.phone || body.phoneNumber || '',
            email: body.email || '',
            date_of_birth: body.dateOfBirth || null,
            allergies: body.allergies || 'None',
            insurance_provider: body.insurance || body.insuranceNumber || '',
            total_purchases: 0,
            last_visit: new Date().toISOString().split('T')[0],
            status: 'active'
          }
          
          const { data: newCustomer, error } = await supabase
            .from('customers')
            .insert(customerData)
            .select()
            .single()
          
          if (!error && newCustomer) {
            return NextResponse.json({ 
              success: true, 
              customer: {
                id: newCustomer.id,
                name: newCustomer.name,
                phone: newCustomer.phone,
                insurance_number: newCustomer.insurance_provider
              },
              message: 'Customer added to database successfully'
            })
          }
        }
      }
    } catch (dbError) {
      console.log('Database unavailable, using fallback storage')
    }
    
    // Fallback to in-memory storage
    const newCustomer = {
      id: Date.now().toString(),
      name: body.name || body.patientName || '',
      phone: body.phone || body.phoneNumber || '',
      email: body.email || '',
      dateOfBirth: body.dateOfBirth || '',
      allergies: body.allergies || 'None',
      insurance: body.insurance || body.insuranceNumber || '',
      totalPurchases: 0,
      lastVisit: new Date().toISOString().split('T')[0],
      status: 'active'
    }
    
    fallbackCustomers.push(newCustomer)
    
    return NextResponse.json({ 
      success: true, 
      customer: {
        id: newCustomer.id,
        name: newCustomer.name,
        phone: newCustomer.phone,
        insurance_number: newCustomer.insurance
      },
      message: 'Customer added successfully (fallback mode)'
    })
  } catch (error) {
    console.error('Customer add error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to add customer'
    }, { status: 500 })
  }
}