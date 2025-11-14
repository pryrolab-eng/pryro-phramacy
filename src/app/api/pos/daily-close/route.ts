import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const dailyClose = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      totalSales: body.totalSales || 145000,
      totalTransactions: body.totalTransactions || 45,
      cashAmount: body.cashAmount || 85000,
      cardAmount: body.cardAmount || 35000,
      mobileMoneyAmount: body.mobileMoneyAmount || 25000,
      closedBy: body.closedBy || 'Cashier',
      closedAt: new Date().toISOString()
    }
    return NextResponse.json({ success: true, dailyClose })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to close day' }, { status: 500 })
  }
}
