import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { invoice, items, customer } = await request.json()
    
    // Mock RRA EBM submission
    const submission = {
      invoiceNumber: invoice,
      ebmNumber: `EBM${Date.now()}`,
      status: 'submitted',
      vatAmount: items.reduce((sum, item) => sum + (item.price * 0.18), 0),
      totalAmount: items.reduce((sum, item) => sum + item.price, 0),
      submissionTime: new Date().toISOString()
    }
    
    return NextResponse.json({ success: true, submission })
  } catch (error) {
    return NextResponse.json({ error: 'RRA EBM submission failed' }, { status: 500 })
  }
}