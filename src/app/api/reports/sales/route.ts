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

    const { guardReportsAccess, entitlementRouteResponse } = await import(
      '@/lib/subscription/route-guards'
    )
    try {
      await guardReportsAccess(supabase, user.id)
    } catch (entErr) {
      const res = entitlementRouteResponse(entErr)
      if (res) return res
      throw entErr
    }

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)
    const scope = parseBranchScopeFromRequest(request)
    const range = scope.from && scope.to
      ? { from: scope.from, to: scope.to }
      : defaultReportRange(30)

    let salesQuery = supabase
      .from('sales')
      .select('total_amount, created_at, id, customer_name, payment_method')
      .eq('pharmacy_id', pharmacyId)
      .gte('created_at', range.from)
      .lte('created_at', range.to)
      .order('created_at', { ascending: true })

    if (scope.branchId) {
      salesQuery = salesQuery.eq('branch_id', scope.branchId)
    }

    const { data: salesData } = await salesQuery

    const dailyTotals: Record<string, { sales: number; orders: number }> = {}

    salesData?.forEach((sale) => {
      const date = sale.created_at.split('T')[0]
      if (!dailyTotals[date]) {
        dailyTotals[date] = { sales: 0, orders: 0 }
      }
      dailyTotals[date].sales += parseFloat(String(sale.total_amount))
      dailyTotals[date].orders += 1
    })

    const dailySales = Object.entries(dailyTotals)
      .map(([date, row]) => ({
        date,
        sales: Math.round(row.sales),
        orders: row.orders,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    let topItemsQuery = supabase
      .from('sale_items')
      .select(
        `
        medication_name,
        total_price,
        quantity,
        sales!inner(pharmacy_id, created_at, branch_id)
      `,
      )
      .eq('sales.pharmacy_id', pharmacyId)
      .gte('sales.created_at', range.from)
      .lte('sales.created_at', range.to)

    if (scope.branchId) {
      topItemsQuery = topItemsQuery.eq('sales.branch_id', scope.branchId)
    }

    const { data: topProductsData } = await topItemsQuery

    const productTotals: Record<string, { sales: number; quantity: number }> = {}
    topProductsData?.forEach((item) => {
      const name = item.medication_name
      if (!productTotals[name]) {
        productTotals[name] = { sales: 0, quantity: 0 }
      }
      productTotals[name].sales += parseFloat(String(item.total_price))
      productTotals[name].quantity += item.quantity
    })

    const topProducts = Object.entries(productTotals)
      .map(([name, data]) => ({
        name,
        sales: Math.round(data.sales),
        quantity: data.quantity,
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 8)

    const paymentTotals: Record<string, number> = {}
    let totalAmount = 0

    salesData?.forEach((sale) => {
      const method =
        sale.payment_method === 'mobile_money'
          ? 'Mobile Money'
          : sale.payment_method === 'cash'
            ? 'Cash'
            : sale.payment_method === 'insurance'
              ? 'Insurance'
              : 'Card'
      const amount = parseFloat(String(sale.total_amount))
      paymentTotals[method] = (paymentTotals[method] || 0) + amount
      totalAmount += amount
    })

    const paymentBreakdown = Object.entries(paymentTotals).map(([method, amount]) => ({
      method,
      percentage: totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0,
      amount: Math.round(amount),
    }))

    const uniqueCustomers = new Set(
      (salesData ?? []).map((s) => s.customer_name).filter(Boolean),
    ).size

    return NextResponse.json({
      dailySales,
      topProducts,
      paymentBreakdown,
      totalSales: Math.round(totalAmount),
      totalOrders: salesData?.length ?? 0,
      activeCustomers: uniqueCustomers,
      branchId: scope.branchId ?? null,
    })
  } catch (error) {
    console.error('Reports sales API error:', error)
    return NextResponse.json({
      dailySales: [],
      topProducts: [],
      paymentBreakdown: [],
      totalSales: 0,
      totalOrders: 0,
      activeCustomers: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
