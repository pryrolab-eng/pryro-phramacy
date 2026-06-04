import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'
import { resolveMedicationCategoryEnum } from '@/lib/pharmacy/medication-category'
import { requireSessionPharmacyId } from '@/lib/pharmacy/get-session-pharmacy'
import { requireSessionBranchId } from '@/lib/pharmacy/get-session-branch'

function readString(body: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = body[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function readNumber(body: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const value = body[key]
    if (value === undefined || value === null || value === '') continue
    const n = Number(value)
    if (!Number.isNaN(n)) return n
  }
  return 0
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)
    const branchId = await requireSessionBranchId(supabase, user.id)

    const body = (await request.json()) as Record<string, unknown>
    const name = readString(body, 'productName', 'name')
    const categoryLabel = readString(body, 'category')
    const category = resolveMedicationCategoryEnum(categoryLabel)

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Product name is required' },
        { status: 400 },
      )
    }

    const { data: medication, error: medError } = await supabase
      .from('medications')
      .insert({
        pharmacy_id: pharmacyId,
        name,
        category,
        manufacturer: readString(body, 'manufacturer') || null,
        barcode: readString(body, 'barcode') || null,
        requires_prescription: category === 'prescription',
        is_active: true,
      })
      .select()
      .single()

    if (medError) {
      console.error('Medication insert error:', medError)
      throw medError
    }

    const { data: inventory, error: invError } = await supabase
      .from('inventory')
      .insert({
        pharmacy_id: pharmacyId,
        branch_id: branchId,
        medication_id: medication.id,
        batch_number: readString(body, 'batchNumber', 'batch_number') || 'BATCH001',
        quantity_in_stock: readNumber(body, 'initialStock', 'initial_stock'),
        unit_cost: readNumber(body, 'purchasePrice', 'purchase_price'),
        selling_price: readNumber(body, 'unitPrice', 'unit_price'),
        minimum_stock_level: readNumber(body, 'minStockAlert', 'min_stock', 'minimum_stock_level'),
        expiry_date: readString(body, 'expiryDate', 'expiry_date') || null,
      })
      .select()
      .single()

    if (invError) {
      console.error('Inventory insert error:', invError)
      throw invError
    }

    return NextResponse.json({ success: true, medication, inventory })
  } catch (error) {
    console.error('Quick add product error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to add product',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
