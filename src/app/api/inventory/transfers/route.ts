import { NextRequest, NextResponse } from 'next/server'
import { requireSessionPharmacyId } from '@/lib/pharmacy/get-session-pharmacy'
import { createClient } from '../../../../../supabase/server'
import { createServiceClient } from '../../../../../supabase/service'
import { transferBranchStock } from '@/lib/pharmacy/transfer-branch-stock'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)

    const { data: transfers, error } = await supabase
      .from('inventory_transfers')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    const formattedTransfers =
      transfers?.map((t) => ({
        id: t.id,
        product: t.medication_name,
        quantity: t.quantity,
        from: t.from_branch_id,
        to: t.to_branch_id,
        status: t.status,
        date: t.created_at,
      })) ?? []

    return NextResponse.json(formattedTransfers)
  } catch (error) {
    console.error('GET /api/inventory/transfers', error)
    return NextResponse.json({ error: 'Failed to fetch transfers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { guardInventoryAccess, entitlementRouteResponse } = await import(
      '@/lib/subscription/route-guards'
    )
    try {
      await guardInventoryAccess(supabase, user.id)
    } catch (entErr) {
      const res = entitlementRouteResponse(entErr)
      if (res) return res
      throw entErr
    }

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)
    const body = await request.json()

    const productId = body.productId ?? body.inventoryId
    const fromBranchId = body.fromBranchId ?? body.from
    const toBranchId = body.toBranchId ?? body.to
    const quantity = parseInt(String(body.quantity), 10)

    if (!productId || !fromBranchId || !toBranchId || !Number.isFinite(quantity)) {
      return NextResponse.json(
        { success: false, error: 'productId, fromBranchId, toBranchId, and quantity are required' },
        { status: 400 },
      )
    }

    const admin = createServiceClient()
    const result = await transferBranchStock(admin, {
      pharmacyId,
      inventoryId: productId,
      fromBranchId,
      toBranchId,
      quantity,
    })

    return NextResponse.json({
      success: true,
      newStock: result.sourceStock,
      destinationStock: result.destinationStock,
      transferId: result.transferId,
    })
  } catch (error) {
    console.error('POST /api/inventory/transfers', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create transfer',
      },
      { status: 500 },
    )
  }
}
