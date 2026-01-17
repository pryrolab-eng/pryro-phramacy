import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { productId, quantity, reason, adjustmentType } = await request.json()
    
    // Get current inventory item
    const { data: inventory, error: fetchError } = await supabase
      .from('inventory')
      .select('quantity_in_stock')
      .eq('id', productId)
      .single()
    
    if (fetchError || !inventory) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    }
    
    // Calculate new stock
    const newStock = adjustmentType === 'increase' 
      ? inventory.quantity_in_stock + quantity 
      : Math.max(0, inventory.quantity_in_stock - quantity)
    
    // Update inventory
    const { error: updateError } = await supabase
      .from('inventory')
      .update({ quantity_in_stock: newStock })
      .eq('id', productId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true, newStock })
  } catch (error) {
    console.error('Adjustment error:', error)
    return NextResponse.json({ success: false, error: 'Adjustment failed' }, { status: 500 })
  }
}
