import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'
import { firstRelation } from '@/lib/supabase/relation'
import { requireSessionPharmacyId } from '@/lib/pharmacy/get-session-pharmacy'
import { requireSessionBranchId } from '@/lib/pharmacy/get-session-branch'
import {
  filterSellableBatches,
  sortBatchesFefo,
} from '@/lib/pos/pharmacy-rules'
import { formatInventoryRowForPos } from '@/lib/pos/format-pos-product'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json([])
    }

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)
    const branchId = await requireSessionBranchId(supabase, user.id)

    const today = new Date().toISOString().slice(0, 10)

    const { data: products, error } = await supabase
      .from('inventory')
      .select(`
        id,
        medication_id,
        batch_number,
        quantity_in_stock,
        selling_price,
        expiry_date,
        medications (
          id,
          name,
          category,
          generic_name,
          strength,
          dosage_form,
          barcode,
          requires_prescription
        )
      `)
      .eq('pharmacy_id', pharmacyId)
      .eq('branch_id', branchId)
      .gt('quantity_in_stock', 0)
      .or(`expiry_date.is.null,expiry_date.gte.${today}`)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json([])
    }

    const formattedProducts = sortBatchesFefo(
      filterSellableBatches(
        (products ?? []).map((item) => {
          const medications = firstRelation(item.medications) as {
            id?: string
            name?: string
            category?: string
            generic_name?: string | null
            strength?: string | null
            dosage_form?: string | null
            barcode?: string | null
            requires_prescription?: boolean | null
          } | null
          const med = medications
            ? { ...medications, id: medications.id ?? item.medication_id }
            : null
          return formatInventoryRowForPos(
            {
              id: item.id,
              batch_number: item.batch_number,
              quantity_in_stock: item.quantity_in_stock,
              selling_price: item.selling_price,
              expiry_date: item.expiry_date,
              medications: med,
            },
            med,
          )
        }),
      ),
    )

    return NextResponse.json(formattedProducts)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json([])
  }
}
