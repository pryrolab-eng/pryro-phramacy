import { NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's pharmacy_id
    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .single()

    if (!userPharmacy) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 403 })
    }
    
    // Get today's sales
    const today = new Date().toISOString().split('T')[0]
    const { data: todaySales } = await supabase
      .from('sales')
      .select('total_amount')
      .gte('created_at', today)
      .eq('pharmacy_id', userPharmacy.pharmacy_id)
    
    const todayTotal = todaySales?.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0) || 0
    
    // Get total products count
    const { count: totalProducts } = await supabase
      .from('medications')
      .select('*', { count: 'exact', head: true })
      .eq('pharmacy_id', userPharmacy.pharmacy_id)
    
    // Get unique customers count
    const { count: totalCustomers } = await supabase
      .from('sales')
      .select('customer_name', { count: 'exact', head: true })
      .eq('pharmacy_id', userPharmacy.pharmacy_id)
    
    const stats = {
      totalProducts: totalProducts || 0,
      lowStockItems: 0,
      todaySales: Math.round(todayTotal),
      monthlyRevenue: Math.round(todayTotal * 30),
      totalCustomers: totalCustomers || 0,
      activeStaff: 0,
      pendingOrders: 0,
      expiringProducts: 0,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('GET /api/pharmacy/dashboard', error)
    return NextResponse.json({
      totalProducts: 0,
      lowStockItems: 0,
      todaySales: 0,
      monthlyRevenue: 0,
      totalCustomers: 0,
      activeStaff: 0,
      pendingOrders: 0,
      expiringProducts: 0,
    })
  }
}
