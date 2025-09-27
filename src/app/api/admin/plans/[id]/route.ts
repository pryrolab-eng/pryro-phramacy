import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../supabase/server'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data: plan, error } = await supabase
      .from('subscription_plans')
      .update({
        name: body.name,
        price: body.price,
        period: body.period,
        features: body.features,
        is_popular: body.is_popular
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, plan })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update plan' }, { status: 500 })
  }
}