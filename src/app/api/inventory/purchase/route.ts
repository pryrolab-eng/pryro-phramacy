import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { productId, quantity, costPrice, supplier } = await request.json()
    
    // Get current inventory item
    const { data: inventory, error: fetchError } = await supabase
      .from('inventory')
      .select('quantity_in_stock')
      .eq('id', productId)
      .single()
    
    if (fetchError || !inventory) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    }
    
    // Update inventory with new stock
    const newStock = inventory.quantity_in_stock + quantity
    
    const { error: updateError } = await supabase
      .from('inventory')
      .update({ 
        quantity_in_stock: newStock,
        unit_cost: costPrice || inventory.unit_cost
      })
      .eq('id', productId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ 
      success: true, 
      newStock 
    })
  } catch (error) {
    console.error('Purchase error:', error)
    return NextResponse.json({ success: false, error: 'Purchase failed' }, { status: 500 })
  }
}
