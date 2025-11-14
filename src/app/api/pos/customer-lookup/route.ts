import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')
  
  const customers = [
    { name: 'John Doe', phone: '0781234567', lastPurchase: '2024-01-15', totalSpent: 45000 },
    { name: 'Jane Smith', phone: '0787654321', lastPurchase: '2024-01-10', totalSpent: 32000 }
  ]
  
  const results = phone ? customers.filter(c => c.phone.includes(phone)) : customers
  
  return NextResponse.json(results)
}
