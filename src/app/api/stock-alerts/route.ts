import { NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'
import { firstRelation } from '@/lib/supabase/relation'
import { requireSessionPharmacyId } from '@/lib/pharmacy/get-session-pharmacy'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ all: [], lowStock: [], expiring: [] })
    }

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)

    const { data: inventory, error } = await supabase
      .from('inventory')
      .select(`
        id,
        batch_number,
        quantity_in_stock,
        minimum_stock_level,
        expiry_date,
        medications (
          name,
          category
        )
      `)
      .eq('pharmacy_id', pharmacyId)

    if (error) throw error

    const lowStock =
      inventory?.filter((item) => item.quantity_in_stock <= item.minimum_stock_level) ?? []

    const expiring =
      inventory?.filter((item) => {
        if (!item.expiry_date) return false
        const expiryDate = new Date(item.expiry_date)
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
        return expiryDate <= thirtyDaysFromNow
      }) ?? []

    const formatItem = (item: (typeof inventory)[number]) => {
      const med = firstRelation(item.medications)
      return {
        id: item.id,
        name: med?.name ?? 'Unknown',
        category: med?.category ?? 'other',
        batch: item.batch_number,
        quantity: item.quantity_in_stock,
        minimum: item.minimum_stock_level,
        expiry: item.expiry_date,
      }
    }

    return NextResponse.json({
      all: inventory?.map(formatItem) ?? [],
      lowStock: lowStock.map(formatItem),
      expiring: expiring.map(formatItem),
    })
  } catch (error) {
    console.error('GET /api/stock-alerts', error)
    return NextResponse.json({ all: [], lowStock: [], expiring: [] })
  }
}
