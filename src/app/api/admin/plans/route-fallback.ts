import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true })

    if (error) throw error
    return NextResponse.json(plans)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data: plan, error } = await supabase
      .from('subscription_plans')
      .insert({
        name: body.name,
        price: body.price,
        period: body.period || 'per month',
        features: body.features,
        is_popular: body.is_popular || false,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, plan })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to add plan' }, { status: 500 })
  }
}