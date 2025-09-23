import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const saleData = await request.json()
    
    const invoice = {
      invoiceNumber: `RRA-${Date.now()}`,
      qrCode: `QR-${Math.random().toString(36).substr(2, 9)}`,
      taxAmount: saleData.subtotal * 0.18,
      totalWithTax: saleData.subtotal * 1.18,
      timestamp: new Date().toISOString(),
      status: 'generated'
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return NextResponse.json({
      success: true,
      invoice,
      message: 'RRA invoice generated successfully'
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'RRA invoice generation failed',
      fallback: true 
    }, { status: 500 })
  }
}