import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: transfers, error } = await supabase
      .from('inventory_transfers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    
    // Format for frontend compatibility
    const formattedTransfers = transfers?.map(t => ({
      id: t.id,
      product: t.medication_name,
      quantity: t.quantity,
      from: t.from_branch_id,
      to: t.to_branch_id,
      status: t.status,
      date: t.created_at
    })) || []

    return NextResponse.json(formattedTransfers)
  } catch (error) {
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

    // Get user's pharmacy_id
    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!userPharmacy) {
      return NextResponse.json({ success: false, error: 'Pharmacy not found' }, { status: 404 })
    }

    const body = await request.json()
    
    // Get current inventory to check stock
    const { data: inventory, error: fetchError } = await supabase
      .from('inventory')
      .select('quantity_in_stock')
      .eq('id', body.productId)
      .single()
    
    if (fetchError || !inventory) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    // Check if enough stock available
    if (inventory.quantity_in_stock < body.quantity) {
      return NextResponse.json({ 
        success: false, 
        error: `Insufficient stock. Available: ${inventory.quantity_in_stock}` 
      }, { status: 400 })
    }

    // Deduct stock from source location
    const newStock = inventory.quantity_in_stock - body.quantity
    const { error: updateError } = await supabase
      .from('inventory')
      .update({ quantity_in_stock: newStock })
      .eq('id', body.productId)

    if (updateError) throw updateError

    // Create transfer record
    const { data: transfer, error } = await supabase
      .from('inventory_transfers')
      .insert({
        pharmacy_id: userPharmacy.pharmacy_id,
        medication_name: body.product,
        quantity: body.quantity,
        from_branch_id: body.from,
        to_branch_id: body.to,
        status: 'completed'
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, transfer, newStock })
  } catch (error) {
    console.error('Transfer error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create transfer' }, { status: 500 })
  }
}
