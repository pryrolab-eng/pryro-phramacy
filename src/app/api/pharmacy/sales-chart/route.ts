import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'
import { requireSessionPharmacyId } from '@/lib/pharmacy/get-session-pharmacy'
import { parseBranchScopeFromRequest } from '@/lib/pharmacy/branch-scope'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json([])
    }

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)
    const scope = parseBranchScopeFromRequest(request)

    let salesQuery = supabase
      .from('sales')
      .select('total_amount, created_at')
      .eq('pharmacy_id', pharmacyId)
      .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())

    if (scope.branchId) {
      salesQuery = salesQuery.eq('branch_id', scope.branchId)
    }

    const { data: salesData } = await salesQuery

    const monthlyData: Record<string, number> = {}
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ]

    salesData?.forEach((sale) => {
      const month = months[new Date(sale.created_at).getMonth()]
      monthlyData[month] =
        (monthlyData[month] || 0) + parseFloat(String(sale.total_amount))
    })

    const chartData = Object.entries(monthlyData).map(([month, revenue]) => ({
      month,
      revenue: Math.round(Number(revenue)),
    }))

    return NextResponse.json(chartData)
  } catch (error) {
    console.error('GET /api/pharmacy/sales-chart', error)
    return NextResponse.json([])
  }
}
