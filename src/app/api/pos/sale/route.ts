import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's pharmacy_id
    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .single()

    if (!userPharmacy) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 403 })
    }
    
    const body = await request.json()
    const { items, customerId, paymentMethod, total } = body
    
    // Create sale record
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        pharmacy_id: userPharmacy.pharmacy_id,
        cashier_id: user.id,
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
