import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { saleId, reason } = await request.json()
    
    const voidedSale = {
      id: saleId,
      voidedAt: new Date().toISOString(),
      reason,
      status: 'voided'
    }
    
    return NextResponse.json({ success: true, voidedSale })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to void sale' }, { status: 500 })
  }
}