import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { amount, phone, provider } = await request.json()
    
    // Mock mobile money payment
    const payment = {
      transactionId: `MM${Date.now()}`,
      amount,
      phone,
      provider,
      status: 'success',
      reference: `REF${Date.now()}`,
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json({ success: true, payment })
  } catch (error) {
    return NextResponse.json({ error: 'Mobile money payment failed' }, { status: 500 })
  }
}
