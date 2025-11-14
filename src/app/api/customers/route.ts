import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    const stats = {
      totalCustomers: customers?.length || 0,
      activeCustomers: customers?.filter(c => c.status === 'active').length || 0,
      newThisMonth: customers?.filter(c => {
        const created = new Date(c.created_at)
        const now = new Date()
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
      }).length || 0
    }
    
    return NextResponse.json({ customers: customers || [], stats })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { name, phone, email, dateOfBirth, allergies, insurance } = await request.json()
    
    const { data, error } = await supabase
      .from('customers')
      .insert([{
        name,
        phone,
        email,
        date_of_birth: dateOfBirth,
        allergies: allergies || 'None',
        insurance: insurance || 'None',
        total_purchases: 0,
        last_visit: new Date().toISOString().split('T')[0],
        status: 'active'
      }])
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, customer: data })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add patient' }, { status: 500 })
  }
}
