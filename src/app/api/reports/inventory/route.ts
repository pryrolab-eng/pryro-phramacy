import { NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .single()

    if (!userPharmacy) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 403 })
    }
    
    // Get inventory alerts data for last 14 days
    const { data: inventoryData } = await supabase
      .from('inventory')
      .select(`
        quantity_in_stock,
        minimum_stock_level,
        expiry_date,
        created_at,
        medications!inner(name, category, pharmacy_id)
      `)
      .eq('medications.pharmacy_id', userPharmacy.pharmacy_id)
      .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true })
    
    const dailyAlerts = []
    const dailyData = {}
    
    inventoryData?.forEach(item => {
      const date = item.created_at.split('T')[0]
      if (!dailyData[date]) {
        dailyData[date] = { lowStock: 0, expiring: 0, totalItems: 0 }
      }
      
      dailyData[date].totalItems++
      
      if (item.quantity_in_stock <= item.minimum_stock_level) {
        dailyData[date].lowStock++
      }
      
      const daysToExpiry = Math.ceil((new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      if (daysToExpiry <= 60 && daysToExpiry > 0) {
        dailyData[date].expiring++
      }
    })
    
    Object.entries(dailyData).forEach(([date, data]) => {
      dailyAlerts.push({ date, ...data })
    })
    
    return NextResponse.json({ inventoryAlerts: dailyAlerts })
  } catch (error) {
    console.error('Inventory reports error:', error)
    return NextResponse.json({ inventoryAlerts: [] })
  }
}
