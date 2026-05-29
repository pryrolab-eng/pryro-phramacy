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

    let categoryQuery = supabase
      .from('sale_items')
      .select(`
        total_price,
        sales!inner(pharmacy_id, branch_id),
        inventory!inner(medications!inner(category))
      `)
      .eq('sales.pharmacy_id', pharmacyId)

    if (scope.branchId) {
      categoryQuery = categoryQuery.eq('sales.branch_id', scope.branchId)
    }

    const { data: salesByCategory } = await categoryQuery

    const categoryTotals: Record<string, number> = {}
    salesByCategory?.forEach((item) => {
      const inventory = firstRelation(item.inventory)
      const medications = firstRelation(inventory?.medications)
      const category = medications?.category || 'other'
      categoryTotals[category] =
        (categoryTotals[category] || 0) + parseFloat(String(item.total_price))
    })

    const chartData = Object.entries(categoryTotals).map(([category, sales]) => ({
      category,
      sales: Math.round(Number(sales)),
      fill: `var(--color-${category})`,
    }))

    return NextResponse.json(chartData)
  } catch (error) {
    console.error('GET /api/pharmacy/category-sales', error)
    return NextResponse.json([])
  }
}
