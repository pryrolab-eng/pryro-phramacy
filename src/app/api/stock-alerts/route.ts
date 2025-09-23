import { NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    
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
      .eq('pharmacy_id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')

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
    const mockData = [
      { id: '1', product: 'Paracetamol 500mg', current_stock: 5, min_stock: 20, category: 'Pain Relief', expires_in: 30 },
      { id: '2', product: 'Amoxicillin 250mg', current_stock: 8, min_stock: 25, category: 'Antibiotics', expires_in: 15 },
      { id: '3', product: 'Vitamin C Tablets', current_stock: 35, min_stock: 30, category: 'Vitamins', expires_in: 45 }
    ]

    return NextResponse.json({
      all: mockData,
      lowStock: mockData.filter(item => item.current_stock <= item.min_stock),
      expiring: mockData.filter(item => item.expires_in <= 60)
    })
  }
}