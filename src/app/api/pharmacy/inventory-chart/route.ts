import { NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'
import { requireSessionPharmacyId } from '@/lib/pharmacy/get-session-pharmacy'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json([])
    }

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)

    const { data: inventoryData } = await supabase
      .from('inventory')
      .select(`
        quantity_in_stock,
        minimum_stock_level,
        created_at,
        medications!inner(pharmacy_id)
      `)
      .eq('medications.pharmacy_id', pharmacyId)

    const monthlyData: Record<string, { inStock: number; lowStock: number }> = {}
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

    inventoryData?.forEach((item) => {
      const month = months[new Date(item.created_at).getMonth()]
      if (!monthlyData[month]) {
        monthlyData[month] = { inStock: 0, lowStock: 0 }
      }
      if (item.quantity_in_stock <= item.minimum_stock_level) {
        monthlyData[month].lowStock++
      } else {
        monthlyData[month].inStock++
      }
    })

    const chartData = months.map((month) => ({
      month,
      inStock: monthlyData[month]?.inStock || 0,
      lowStock: monthlyData[month]?.lowStock || 0,
    }))

    return NextResponse.json(chartData)
  } catch (error) {
    console.error('GET /api/pharmacy/inventory-chart', error)
    return NextResponse.json([])
  }
}
