import { NextRequest, NextResponse } from 'next/server'

const insurancePrices = {
  'MMI': { 'Amoxicillin 250mg': 500, 'Paracetamol 500mg': 300 },
  'RSSB': { 'Amoxicillin 250mg': 480, 'Paracetamol 500mg': 280 },
  'Radiant': { 'Amoxicillin 250mg': 520, 'Paracetamol 500mg': 320 }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const insurance = searchParams.get('insurance')
  const product = searchParams.get('product')
  
  if (insurance && product) {
    const price = insurancePrices[insurance]?.[product] || null
    return NextResponse.json({ price })
  }
  
  return NextResponse.json(insurancePrices[insurance] || {})
}

export async function POST(request: NextRequest) {
  try {
    const { insurance, priceList } = await request.json()
    
    // Update insurance prices (normally from Excel import)
    insurancePrices[insurance] = { ...insurancePrices[insurance], ...priceList }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Price update failed' }, { status: 500 })
  }
}
