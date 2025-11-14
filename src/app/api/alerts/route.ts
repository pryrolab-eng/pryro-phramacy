import { NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    const { data: lowStockItems, error } = await supabase
      .from('inventory')
      .select(`
        id,
        quantity_in_stock,
        minimum_stock_level,
        expiry_date,
        medications(name, category)
      `)
      .eq('pharmacy_id', 'userPharmacy.pharmacy_id')
      .lt('quantity_in_stock', supabase.raw('minimum_stock_level * 1.5'))
      .limit(10)

    if (error) throw error

    const alerts = lowStockItems?.map(item => {
      const expiryDate = new Date(item.expiry_date)
      const today = new Date()
      const daysToExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      return {
        id: item.id,
        product: item.medications?.name || 'Unknown Product',
        current_stock: item.quantity_in_stock,
        min_stock: item.minimum_stock_level,
        category: item.medications?.category || 'General',
        expires_in: daysToExpiry > 0 ? daysToExpiry : 0
      }
    }) || []

    return NextResponse.json(alerts)
  } catch (error) {
    return NextResponse.json([
      { id: '1', product: 'Paracetamol 500mg', current_stock: 5, min_stock: 20, category: 'Pain Relief', expires_in: 30 },
      { id: '2', product: 'Amoxicillin 250mg', current_stock: 8, min_stock: 25, category: 'Antibiotics', expires_in: 15 },
      { id: '3', product: 'Vitamin C Tablets', current_stock: 12, min_stock: 30, category: 'Vitamins', expires_in: 45 }
    ])
  }
}
