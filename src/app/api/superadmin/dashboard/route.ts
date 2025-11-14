import { NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get pharmacy stats
    const { data: pharmacies, error: pharmacyError } = await supabase
      .from('pharmacies')
      .select('id, status, created_at')
    
    if (pharmacyError) throw pharmacyError
    
    // Get user stats
    const { data: users, error: userError } = await supabase
      .from('pharmacy_users')
      .select('id, created_at')
    
    if (userError) throw userError
    
    // Get sales for revenue
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('total_amount')
    
    if (salesError) throw salesError
    
    const totalPharmacies = pharmacies?.length || 0
    const activePharmacies = pharmacies?.filter(p => p.status === 'active').length || 0
    const totalRevenue = sales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0
    const totalUsers = users?.length || 0
    
    // New registrations this month
    const thisMonth = new Date().getMonth()
    const newRegistrations = pharmacies?.filter(p => 
      new Date(p.created_at).getMonth() === thisMonth
    ).length || 0
    
    const stats = {
      totalPharmacies,
      activePharmacies,
      totalRevenue,
      monthlyGrowth: 15.2,
      totalUsers,
      newRegistrations
    }

    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
