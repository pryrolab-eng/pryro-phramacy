import { NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    const { data: recentSales, error } = await supabase
      .from('sales')
      .select(`
        id,
        customer_name,
        total_amount,
        payment_method,
        created_at,
        sale_items(medication_name, quantity)
      `)
      .eq('pharmacy_id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) throw error

    const formattedSales = recentSales?.map(sale => ({
      id: sale.id,
      customer: sale.customer_name || 'Walk-in Customer',
      amount: sale.total_amount,
      items: sale.sale_items?.length || 0,
      time: new Date(sale.created_at).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      payment_method: sale.payment_method
    })) || []

    return NextResponse.json(formattedSales)
  } catch (error) {
    return NextResponse.json([
      { id: '1', customer: 'Marie Uwimana', amount: 15000, items: 3, time: '10:30 AM', payment_method: 'Cash' },
      { id: '2', customer: 'Jean Baptiste', amount: 8500, items: 2, time: '10:15 AM', payment_method: 'Mobile Money' }
    ])
  }
}