import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: loyalty, error } = await supabase
      .from('customer_loyalty')
      .select('*, customers(name)')
      .order('points', { ascending: false })

    if (error) throw error
    
    // Format for frontend compatibility
    const formattedLoyalty = loyalty?.map(l => ({
      id: l.id,
      customerId: l.customer_id,
      name: l.customers?.name || 'Unknown',
      points: l.points,
      tier: l.tier,
      totalSpent: l.total_spent
    })) || []

    return NextResponse.json(formattedLoyalty)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch loyalty data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { customerId, points, action } = await request.json()
    
    // Get current loyalty record
    const { data: loyalty, error: fetchError } = await supabase
      .from('customer_loyalty')
      .select('*')
      .eq('customer_id', customerId)
      .single()

    if (fetchError) throw fetchError

    const newPoints = loyalty.points + (action === 'add' ? points : -points)
    const newTier = newPoints >= 500 ? 'Gold' : newPoints >= 200 ? 'Silver' : 'Bronze'

    const { data: updated, error: updateError } = await supabase
      .from('customer_loyalty')
      .update({ 
        points: newPoints,
        tier: newTier
      })
      .eq('customer_id', customerId)
      .select()
      .single()

    if (updateError) throw updateError
    return NextResponse.json({ success: true, customer: updated })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update loyalty points' }, { status: 500 })
  }
}