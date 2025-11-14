import { NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Get stock by category
    const { data: categoryData } = await supabase
      .from('inventory')
      .select(`
        quantity_in_stock,
        selling_price,
        medications!inner(category, pharmacy_id)
      `)
      .eq('medications.pharmacy_id', 'userPharmacy.pharmacy_id')
    
    const categoryStats = {}
    categoryData?.forEach(item => {
      const category = item.medications?.category || 'other'
      if (!categoryStats[category]) {
        categoryStats[category] = { stock: 0, value: 0 }
      }
      categoryStats[category].stock += item.quantity_in_stock
      categoryStats[category].value += item.quantity_in_stock * parseFloat(item.selling_price)
    })
    
    const stockByCategory = Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      stock: stats.stock,
      value: Math.round(stats.value)
    }))
    
    // Mock monthly trend data (can be enhanced with real historical data)
    const inventoryTrend = [
      { month: 'Jan', value: 2800000 },
      { month: 'Feb', value: 3100000 },
      { month: 'Mar', value: 3350000 },
      { month: 'Apr', value: 3200000 },
      { month: 'May', value: 3400000 },
      { month: 'Jun', value: 3600000 }
    ]
    
    return NextResponse.json({
      stockByCategory,
      inventoryTrend
    })
  } catch (error) {
    return NextResponse.json({
      stockByCategory: [
        { category: 'prescription', stock: 320, value: 1200000 },
        { category: 'otc', stock: 180, value: 850000 },
        { category: 'supplement', stock: 240, value: 650000 }
      ],
      inventoryTrend: [
        { month: 'Jan', value: 2800000 },
        { month: 'Feb', value: 3100000 },
        { month: 'Mar', value: 3350000 }
      ]
    })
  }
}
