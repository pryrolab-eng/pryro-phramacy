import { NextRequest, NextResponse } from 'next/server'

let plans = [
  {
    id: '1',
    name: "Free",
    price: 0,
    period: "forever",
    features: ["Basic POS", "Up to 3 users", "Email support", "Basic reports"],
    is_active: true
  },
  {
    id: '2',
    name: "Standard", 
    price: 50000,
    period: "per month",
    features: ["Full POS", "Up to 10 users", "Insurance integration", "Phone support", "Advanced reports"],
    is_active: true
  },
  {
    id: '3',
    name: "Premium",
    price: 120000,
    period: "per month", 
    features: ["Everything in Standard", "Unlimited users", "Advanced analytics", "Priority support", "Custom integrations"],
    is_active: true
  }
]

export async function GET() {
  return NextResponse.json(plans)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const newPlan = {
      id: Date.now().toString(),
      name: body.name,
      price: body.price,
      period: body.period,
      features: body.features,
      is_active: true
    }

    plans.push(newPlan)

    return NextResponse.json({ success: true, plan: newPlan })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to add plan' })
  }
}