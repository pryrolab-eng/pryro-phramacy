import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'
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

    let query = supabase
      .from('sales')
      .select(
        `
        id,
        customer_name,
        total_amount,
        payment_method,
        created_at,
        branch_id,
        sale_items(medication_name, quantity)
      `,
      )
      .eq('pharmacy_id', pharmacyId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (scope.branchId) {
      query = query.eq('branch_id', scope.branchId)
    }

    const { data: recentSales, error } = await query

    if (error) throw error

    const formattedSales =
      recentSales?.map((sale) => ({
        id: sale.id,
        customer: sale.customer_name || 'Walk-in Customer',
        amount: parseFloat(String(sale.total_amount)),
        items: sale.sale_items?.length || 1,
        time: new Date(sale.created_at).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        payment_method:
          sale.payment_method === 'mobile_money'
            ? 'Mobile Money'
            : sale.payment_method === 'cash'
              ? 'Cash'
              : sale.payment_method === 'insurance'
                ? 'Insurance'
                : 'Card',
      })) ?? []

    return NextResponse.json(formattedSales)
  } catch (error) {
    console.error('GET /api/pos', error)
    return NextResponse.json([])
  }
}
