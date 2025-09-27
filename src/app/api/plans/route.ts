import { NextResponse } from 'next/server'

const plans = [
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
]

export async function GET() {
  return NextResponse.json(plans)
}