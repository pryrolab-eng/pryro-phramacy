import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'
import { firstRelation } from '@/lib/supabase/relation'
import { requireSessionPharmacyId } from '@/lib/pharmacy/get-session-pharmacy'
import { parseBranchScopeFromRequest } from '@/lib/pharmacy/branch-scope'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json([])

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)
    const scope = parseBranchScopeFromRequest(request)

    let weeklyQuery = supabase
      .from('sale_items')
      .select(`
        total_price,
        sales!inner(created_at, pharmacy_id, branch_id),
        inventory!inner(medications!inner(category))
      `)
      .eq('sales.pharmacy_id', pharmacyId)
      .gte('sales.created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    if (scope.branchId) {
      weeklyQuery = weeklyQuery.eq('sales.branch_id', scope.branchId)
    }

    const { data: weeklyData } = await weeklyQuery

    const dailyData: Record<string, { prescription: number; otc: number }> = {}
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    weeklyData?.forEach((item) => {
      const sales = firstRelation(item.sales)
      if (!sales?.created_at) return
      const dayIndex = new Date(sales.created_at).getDay()
      const day = days[dayIndex === 0 ? 6 : dayIndex - 1]
      const inventory = firstRelation(item.inventory)
      const medications = firstRelation(inventory?.medications)
      const category = medications?.category
      if (!dailyData[day]) {
        dailyData[day] = { prescription: 0, otc: 0 }
      }
      const amount = parseFloat(String(item.total_price))
      if (category === 'prescription') {
        dailyData[day].prescription += amount
      } else {
        dailyData[day].otc += amount
      }
    })

    const chartData = days.map((day) => ({
      day,
      prescription: Math.round(dailyData[day]?.prescription ?? 0),
      otc: Math.round(dailyData[day]?.otc ?? 0),
    }))

    return NextResponse.json(chartData)
  } catch (error) {
    console.error('GET /api/pharmacy/weekly-sales', error)
    return NextResponse.json([])
  }
}
