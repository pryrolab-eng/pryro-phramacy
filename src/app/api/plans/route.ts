import { NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true })
    
    if (error) throw error
    
    return NextResponse.json(plans || [])
  } catch (error) {
    console.error('Error fetching plans:', error)
    // Fallback to hardcoded plans
    return NextResponse.json([
      {
        id: '1',
        name: 'Free',
        price: 0,
        period: 'forever',
        features: ['Basic POS', 'Up to 3 users', 'Email support', 'Basic reports'],
        popular: false
      },
      {
        id: '2',
        name: 'Standard',
        price: 50000,
        period: 'per month',
        features: ['Full POS', 'Up to 10 users', 'Insurance integration', 'Phone support', 'Advanced reports'],
        popular: true
      },
      {
        id: '3',
        name: 'Premium',
        price: 120000,
        period: 'per month',
        features: ['Everything in Standard', 'Unlimited users', 'Advanced analytics', 'Priority support', 'Custom integrations'],
        popular: false
      }
    ])
  }
}
