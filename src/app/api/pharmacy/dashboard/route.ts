import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'
import { requireSessionPharmacyId } from '@/lib/pharmacy/get-session-pharmacy'
import {
  defaultReportRange,
  parseBranchScopeFromRequest,
} from '@/lib/pharmacy/branch-scope'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)
    const scope = parseBranchScopeFromRequest(request)
    const range = scope.from && scope.to
      ? { from: scope.from, to: scope.to }
      : defaultReportRange(30)

    const today = new Date().toISOString().split('T')[0]

    let todaySalesQuery = supabase
      .from('sales')
      .select('total_amount')
      .gte('created_at', today)
      .eq('pharmacy_id', pharmacyId)

    let rangeSalesQuery = supabase
      .from('sales')
      .select('total_amount, id, customer_name')
      .eq('pharmacy_id', pharmacyId)
      .gte('created_at', range.from)
      .lte('created_at', range.to)

    if (scope.branchId) {
      todaySalesQuery = todaySalesQuery.eq('branch_id', scope.branchId)
      rangeSalesQuery = rangeSalesQuery.eq('branch_id', scope.branchId)
    }

    const [{ data: todaySales }, { data: rangeSales }] = await Promise.all([
      todaySalesQuery,
      rangeSalesQuery,
    ])

    const todayTotal =
      todaySales?.reduce((sum, sale) => sum + parseFloat(String(sale.total_amount)), 0) ?? 0

    const monthlyRevenue =
      rangeSales?.reduce((sum, sale) => sum + parseFloat(String(sale.total_amount)), 0) ?? 0

    const uniqueCustomers = new Set(
      (rangeSales ?? []).map((s) => s.customer_name).filter(Boolean),
    ).size

    const { count: totalProducts } = await supabase
      .from('medications')
      .select('*', { count: 'exact', head: true })
      .eq('pharmacy_id', pharmacyId)

    const { count: activeStaff } = await supabase
      .from('pharmacy_users')
      .select('*', { count: 'exact', head: true })
      .eq('pharmacy_id', pharmacyId)
      .eq('is_active', true)

    const stats = {
      totalProducts: totalProducts ?? 0,
      lowStockItems: 0,
      todaySales: Math.round(todayTotal),
      monthlyRevenue: Math.round(monthlyRevenue),
      totalCustomers: uniqueCustomers,
      activeStaff: activeStaff ?? 0,
      pendingOrders: rangeSales?.length ?? 0,
      expiringProducts: 0,
      branchId: scope.branchId ?? null,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('GET /api/pharmacy/dashboard', error)
    return NextResponse.json({
      totalProducts: 0,
      lowStockItems: 0,
      todaySales: 0,
      monthlyRevenue: 0,
      totalCustomers: 0,
      activeStaff: 0,
      pendingOrders: 0,
      expiringProducts: 0,
    })
  }
}
