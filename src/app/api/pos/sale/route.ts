import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { items, customerId, paymentMethod, total } = body
    
    // Create sale record
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        pharmacy_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        cashier_id: 'current-pharmacist-id',
        customer_name: customerId || 'Walk-in Customer',
        total_amount: parseFloat(total),
        payment_method: paymentMethod || 'cash',
        status: 'completed'
      })
      .select()
      .single()

    if (saleError) throw saleError

    // Create sale items
    if (items && items.length > 0) {
      const saleItems = items.map((item: any) => ({
        sale_id: sale.id,
        medication_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.quantity * item.price
      }))

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems)

      if (itemsError) throw itemsError
    }
    
    return NextResponse.json({ success: true, sale }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process sale' }, { status: 500 })
  }
}