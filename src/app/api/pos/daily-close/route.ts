import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'
import { requireSessionPharmacyId } from '@/lib/pharmacy/get-session-pharmacy'
import { requireSessionBranchId } from '@/lib/pharmacy/get-session-branch'
import { guardPharmacyFeature } from '@/lib/subscription/api-guard'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)
    const branchId = await requireSessionBranchId(supabase, user.id)

    await guardPharmacyFeature(supabase, user.id, {
      feature: 'pos.access',
      branchId,
    })

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const { data: sales, error } = await supabase
      .from('sales')
      .select('id, total_amount, payment_method, status, created_at')
      .eq('pharmacy_id', pharmacyId)
      .eq('branch_id', branchId)
      .eq('status', 'completed')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())

    if (error) throw error

    const rows = sales ?? []
    let cashAmount = 0
    let cardAmount = 0
    let mobileMoneyAmount = 0
    let insuranceAmount = 0
    let mixedAmount = 0
    let totalSales = 0

    for (const sale of rows) {
      const amount = Number(sale.total_amount) || 0
      totalSales += amount
      switch (sale.payment_method) {
        case 'cash':
          cashAmount += amount
          break
        case 'card':
          cardAmount += amount
          break
        case 'mobile_money':
          mobileMoneyAmount += amount
          break
        case 'insurance':
          insuranceAmount += amount
          break
        case 'mixed':
          mixedAmount += amount
          break
        default:
          cashAmount += amount
      }
    }

    const dailyClose = {
      id: `${branchId}-${startOfDay.toISOString().slice(0, 10)}`,
      date: startOfDay.toISOString().slice(0, 10),
      branchId,
      totalSales,
      totalTransactions: rows.length,
      cashAmount,
      cardAmount,
      mobileMoneyAmount,
      insuranceAmount,
      mixedAmount,
      closedBy: user.id,
      closedAt: new Date().toISOString(),
    }

    return NextResponse.json({ success: true, dailyClose })
  } catch (error) {
    console.error('Daily close error:', error)
    return NextResponse.json({ error: 'Failed to close day' }, { status: 500 })
  }
}
