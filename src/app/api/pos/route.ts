import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json([])
    }

    // Get user's pharmacy_id
    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .single()

    if (!userPharmacy) {
      return NextResponse.json([])
    }
    
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
      .eq('pharmacy_id', userPharmacy.pharmacy_id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) throw error

    const formattedSales = recentSales?.map(sale => ({
      id: sale.id,
      customer: sale.customer_name || 'Walk-in Customer',
      amount: parseFloat(sale.total_amount),
      items: sale.sale_items?.length || 1,
      time: new Date(sale.created_at).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      payment_method: sale.payment_method === 'mobile_money' ? 'Mobile Money' : 
                     sale.payment_method === 'cash' ? 'Cash' : 
                     sale.payment_method === 'mixed' ? 'Mixed' : 'Card'
    })) || []

    return NextResponse.json(formattedSales)
  } catch (error) {
    return NextResponse.json([])
  }
}
