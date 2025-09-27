import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { cart, customer } = await request.json()
    
    const heldSale = {
      id: Date.now().toString(),
      cart,
      customer,
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json({ success: true, heldSale })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to hold sale' }, { status: 500 })
  }
}

export async function GET() {
  const heldSales = [
    { id: '1', customer: { name: 'John Doe' }, items: 3, timestamp: new Date().toISOString() }
  ]
  
  return NextResponse.json(heldSales)
}