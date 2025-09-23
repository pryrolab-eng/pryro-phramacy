import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, customerId, paymentMethod, total } = body
    
    const sale = {
      id: Date.now().toString(),
      items,
      customerId,
      paymentMethod,
      total: parseFloat(total),
      timestamp: new Date().toISOString(),
      pharmacistId: 'current-pharmacist-id'
    }
    
    return NextResponse.json({ success: true, sale }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process sale' }, { status: 500 })
  }
}