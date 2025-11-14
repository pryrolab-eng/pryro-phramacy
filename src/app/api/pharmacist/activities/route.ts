import { NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get recent sales as activities
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('id, customer_name, total_amount, created_at')
      .order('created_at', { ascending: false })
      .limit(4)
    
    if (salesError) throw salesError
    
    // Format as activities
    const activities = sales?.map(sale => ({
      id: sale.id,
      type: 'sale',
      description: `Sale to ${sale.customer_name || 'Walk-in Customer'} - ${sale.total_amount} RWF`,
      time: new Date(sale.created_at).toLocaleTimeString(),
      status: 'completed'
    })) || []

    return NextResponse.json(activities)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }
}
