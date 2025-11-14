import { NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ all: [], lowStock: [], expiring: [] })
    }

    // Get user's pharmacy_id
    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .single()

    if (!userPharmacy) {
      return NextResponse.json({ all: [], lowStock: [], expiring: [] })
    }
    
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select(`
        id,
        batch_number,
        quantity_in_stock,
        minimum_stock_level,
        expiry_date,
        medications (
          name,
          category
        )
      `)
      .eq('pharmacy_id', userPharmacy.pharmacy_id)

    if (error) throw error

    const currentDate = new Date()
    const formattedAlerts = inventory?.map(item => {
      const expiryDate = new Date(item.expiry_date)
      const daysToExpiry = Math.ceil((expiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
      
      return {
        id: item.id,
        product: item.medications?.name || 'Unknown Product',
        current_stock: item.quantity_in_stock,
        min_stock: item.minimum_stock_level,
        category: item.medications?.category || 'General',
        expires_in: daysToExpiry
      }
    }) || []

    const lowStock = formattedAlerts.filter(item => item.current_stock <= item.min_stock)
    const expiring = formattedAlerts.filter(item => item.expires_in <= 60 && item.expires_in > 0)

    return NextResponse.json({
      all: formattedAlerts,
      lowStock,
      expiring
    })
  } catch (error) {
    console.error('Error fetching stock alerts:', error)
    return NextResponse.json({ all: [], lowStock: [], expiring: [] })
  }
}
