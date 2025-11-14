import { NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

let lastUpdateTime = new Date()

export async function GET() {
  try {
    const supabase = await createClient()
    const updates = []

    // Check for recent inventory changes
    const { data: inventoryUpdates } = await supabase
      .from('inventory')
      .select('id, quantity_in_stock, updated_at')
      .gte('updated_at', lastUpdateTime.toISOString())

    if (inventoryUpdates?.length) {
      updates.push({
        type: 'inventory_update',
        data: inventoryUpdates
      })
    }

    // Check for new sales
    const { data: newSales } = await supabase
      .from('sales')
      .select('id, total_amount, created_at')
      .gte('created_at', lastUpdateTime.toISOString())

    if (newSales?.length) {
      updates.push({
        type: 'new_sale',
        data: newSales
      })
    }

    lastUpdateTime = new Date()
    return NextResponse.json(updates)
  } catch (error) {
    return NextResponse.json([])
  }
}
