import { NextRequest, NextResponse } from 'next/server'

const customerHistory = {
  'CUST001': [
    { id: '1', date: '2024-01-10', items: ['Paracetamol 500mg', 'Vitamin C'], amount: 15000, paymentMethod: 'Cash' },
    { id: '2', date: '2024-01-15', items: ['Amoxicillin 250mg'], amount: 12000, paymentMethod: 'Insurance' }
  ],
  'CUST002': [
    { id: '3', date: '2024-01-12', items: ['Aspirin 100mg', 'Cough Syrup'], amount: 8000, paymentMethod: 'Mobile Money' }
  ]
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const customerId = searchParams.get('customerId')
  
  if (customerId) {
    return NextResponse.json(customerHistory[customerId] || [])
  }
  
  return NextResponse.json(customerHistory)
}
