import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'
import { firstRelation } from '@/lib/supabase/relation'
import {
  guardPharmacyFeature,
  handleEntitlementRouteError,
} from '@/lib/subscription/api-guard'
import {
  entitlementRouteResponse,
  guardPosInsurance,
} from '@/lib/subscription/route-guards'
import {
  cartHasNearExpiry,
  computeDaysToExpiry,
  isExpired,
  validateNoExpiredInCart,
  validatePrescriptionForSale,
  type PrescriptionConfirmation,
} from '@/lib/pos/pharmacy-rules'

type SaleLine = {
  id: string
  name?: string
  quantity: number
  price?: number
  batch?: string
  expiryDate?: string | null
  daysToExpiry?: number
  requiresPrescription?: boolean
}

function mapPaymentMethod(method: string): string {
  switch (method) {
    case 'mobile':
      return 'mobile_money'
    case 'split':
      return 'mixed'
    default:
      return method || 'cash'
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const branchId =
      typeof body.branch_id === 'string'
        ? body.branch_id
        : typeof body.branchId === 'string'
          ? body.branchId
          : null

    if (!branchId) {
      return NextResponse.json(
        { error: 'branchId is required for POS sales' },
        { status: 400 },
      )
    }

    const { pharmacyId: pharmacy_id } = await guardPharmacyFeature(
      supabase,
      user.id,
      {
        feature: 'pos.access',
        branchId,
        consumeTransaction: true,
      },
    )

    const {
      customer,
      items,
      subtotal,
      insuranceCoverage,
      patientAmount,
      paymentMethod,
      cashAmount,
      insuranceAmount,
      prescriptionConfirmation,
      nearExpiryAcknowledged,
    } = body as {
      customer?: Record<string, unknown>
      items?: SaleLine[]
      subtotal?: number | string
      insuranceCoverage?: number | string
      patientAmount?: number | string
      paymentMethod?: string
      cashAmount?: number | string
      insuranceAmount?: number | string
      prescriptionConfirmation?: PrescriptionConfirmation
      nearExpiryAcknowledged?: boolean
    }

    const saleItems = items ?? []
    if (saleItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    const expiredErr = validateNoExpiredInCart(saleItems)
    if (expiredErr) {
      return NextResponse.json({ error: expiredErr }, { status: 400 })
    }

    if (cartHasNearExpiry(saleItems) && !nearExpiryAcknowledged) {
      return NextResponse.json(
        {
          error:
            'Near-expiry items in cart. Confirm acknowledgement before completing the sale.',
          code: 'NEAR_EXPIRY_ACK_REQUIRED',
        },
        { status: 400 },
      )
    }

    const rxErr = validatePrescriptionForSale(
      saleItems,
      prescriptionConfirmation,
    )
    if (rxErr) {
      return NextResponse.json(
        { error: rxErr, code: 'PRESCRIPTION_REQUIRED' },
        { status: 400 },
      )
    }

    const usesInsurance =
      (customer?.insuranceType && customer.insuranceType !== 'cash') ||
      Number(insuranceCoverage) > 0 ||
      Number(insuranceAmount) > 0

    if (usesInsurance) {
      try {
        await guardPosInsurance(supabase, user.id)
      } catch (entErr) {
        const res = entitlementRouteResponse(entErr)
        if (res) return res
        throw entErr
      }
    }

    const inventoryIds = saleItems.map((i) => i.id)
    const { data: inventoryRows, error: invFetchError } = await supabase
      .from('inventory')
      .select(
        `
        id,
        pharmacy_id,
        branch_id,
        batch_number,
        quantity_in_stock,
        expiry_date,
        medications ( name, requires_prescription )
      `,
      )
      .in('id', inventoryIds)

    if (invFetchError) throw invFetchError

    const inventoryById = new Map(
      (inventoryRows ?? []).map((row) => [row.id, row]),
    )

    const today = new Date().toISOString().slice(0, 10)

    for (const item of saleItems) {
      const inv = inventoryById.get(item.id)
      if (!inv) {
        return NextResponse.json(
          { error: `Product not found: ${item.name ?? item.id}` },
          { status: 400 },
        )
      }

      if (inv.pharmacy_id !== pharmacy_id || inv.branch_id !== branchId) {
        return NextResponse.json(
          {
            error: `${item.name ?? 'Item'} is not in stock at the selected branch`,
          },
          { status: 400 },
        )
      }

      const daysToExpiry = computeDaysToExpiry(inv.expiry_date)
      if (isExpired(daysToExpiry)) {
        return NextResponse.json(
          {
            error: `Cannot sell expired batch for ${item.name ?? 'item'} (${inv.batch_number})`,
          },
          { status: 400 },
        )
      }

      const med = firstRelation(inv.medications) as {
        requires_prescription?: boolean
      } | null

      if (med?.requires_prescription && !prescriptionConfirmation?.confirmed) {
        return NextResponse.json(
          {
            error: `Prescription required for ${item.name ?? 'item'}`,
            code: 'PRESCRIPTION_REQUIRED',
          },
          { status: 400 },
        )
      }

      if (inv.quantity_in_stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${item.name ?? 'item'} (batch ${inv.batch_number})`,
          },
          { status: 400 },
        )
      }

      if (inv.expiry_date && inv.expiry_date < today) {
        return NextResponse.json(
          { error: `Batch ${inv.batch_number} is expired` },
          { status: 400 },
        )
      }
    }

    let insuranceProviderId = null
    if (customer?.insuranceType && customer.insuranceType !== 'cash') {
      const { data: insuranceProvider } = await supabase
        .from('insurance_providers')
        .select('id')
        .eq('name', customer.insuranceType as string)
        .eq('pharmacy_id', pharmacy_id)
        .single()

      insuranceProviderId = insuranceProvider?.id
    }

    const { data: openShift } = await supabase
      .from('cashier_shifts')
      .select('id, total_sales, transaction_count')
      .eq('cashier_id', user.id)
      .eq('branch_id', branchId)
      .eq('status', 'open')
      .maybeSingle()

    const dbPaymentMethod = mapPaymentMethod(paymentMethod ?? 'cash')
    const noteParts: string[] = []
    if (customer?.insuranceNumber) {
      noteParts.push(`Insurance: ${customer.insuranceNumber}`)
    }
    if (prescriptionConfirmation?.confirmed) {
      noteParts.push('Rx confirmed')
      if (prescriptionConfirmation.patientName) {
        noteParts.push(`Patient: ${prescriptionConfirmation.patientName}`)
      }
      if (prescriptionConfirmation.prescriberName) {
        noteParts.push(`Prescriber: ${prescriptionConfirmation.prescriberName}`)
      }
      if (prescriptionConfirmation.notes) {
        noteParts.push(prescriptionConfirmation.notes)
      }
    }
    if (dbPaymentMethod === 'mixed') {
      noteParts.push(
        `Split cash: ${cashAmount ?? 0}, insurance/other: ${insuranceAmount ?? 0}`,
      )
    }

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        pharmacy_id,
        branch_id: branchId,
        cashier_id: user.id,
        customer_name: (customer?.name as string) || 'Walk-in Customer',
        customer_phone: (customer?.phone as string) || null,
        insurance_provider_id: insuranceProviderId,
        subtotal: parseFloat(String(subtotal)) || 0,
        insurance_amount: parseFloat(String(insuranceCoverage)) || 0,
        customer_amount:
          parseFloat(String(patientAmount)) ||
          parseFloat(String(subtotal)) ||
          0,
        total_amount: parseFloat(String(subtotal)) || 0,
        payment_method: dbPaymentMethod,
        status: 'completed',
        receipt_number: `RCP-${Date.now()}`,
        notes: noteParts.length > 0 ? noteParts.join(' | ') : null,
        shift_id: openShift?.id ?? null,
      })
      .select()
      .single()

    if (saleError) {
      console.error('Sale creation error:', saleError)
      throw saleError
    }

    const saleItemRows = saleItems.map((item) => ({
      sale_id: sale.id,
      inventory_id: item.id,
      medication_name: item.name ?? 'Unknown',
      quantity: item.quantity,
      unit_price: item.price ?? 0,
      total_price: item.quantity * (item.price ?? 0),
      batch_number: item.batch,
      expiry_date: item.expiryDate,
    }))

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItemRows)

    if (itemsError) {
      console.error('Sale items error:', itemsError)
      throw itemsError
    }

    for (const item of saleItems) {
      const inv = inventoryById.get(item.id)!
      const newQuantity = inv.quantity_in_stock - item.quantity

      const { error: stockError } = await supabase
        .from('inventory')
        .update({ quantity_in_stock: newQuantity })
        .eq('id', item.id)
        .eq('branch_id', branchId)

      if (stockError) throw stockError

      const { error: movementError } = await supabase.from('stock_movements').insert({
        pharmacy_id,
        inventory_id: item.id,
        movement_type: 'out',
        quantity: item.quantity,
        reference_id: sale.id,
        reference_type: 'sale',
        notes: `POS sale ${sale.receipt_number}`,
        created_by: user.id,
      })

      if (movementError) {
        console.error('Stock movement log error:', movementError)
      }
    }

    if (openShift) {
      const saleTotal =
        parseFloat(String(patientAmount)) ||
        parseFloat(String(subtotal)) ||
        0
      await supabase
        .from('cashier_shifts')
        .update({
          total_sales: Number(openShift.total_sales ?? 0) + saleTotal,
          transaction_count: Number(openShift.transaction_count ?? 0) + 1,
        })
        .eq('id', openShift.id)
    }

    if (insuranceProviderId && Number(insuranceCoverage) > 0) {
      const { error: claimError } = await supabase.from('insurance_claims').insert({
        pharmacy_id,
        sale_id: sale.id,
        insurance_provider_id: insuranceProviderId,
        patient_name: (customer?.name as string) || 'Unknown',
        patient_id_number: (customer?.insuranceNumber as string) || null,
        claim_amount: parseFloat(String(insuranceCoverage)),
        status: 'pending',
      })

      if (claimError) {
        console.error('Insurance claim error:', claimError)
      }
    }

    return NextResponse.json({
      success: true,
      sale,
      receiptNumber: sale.receipt_number,
      message: 'Sale processed successfully',
    })
  } catch (error) {
    const entitlement = handleEntitlementRouteError(error)
    if (entitlement) return entitlement
    console.error('Sale processing error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process sale',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
