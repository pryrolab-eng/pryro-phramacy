import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { insuranceNumber } = await request.json()
    
    const insuranceData = {
      'INS001': { type: 'RSSB', coverage: 80, status: 'active' },
      'INS002': { type: 'Radiant', coverage: 70, status: 'active' },
      'INS003': { type: 'MMI', coverage: 90, status: 'active' }
    }
    
    const result = insuranceData[insuranceNumber as keyof typeof insuranceData]
    
    if (result) {
      return NextResponse.json({
        success: true,
        insuranceType: result.type,
        coveragePercent: result.coverage,
        status: result.status
      })
    }
    
    return NextResponse.json({ success: false, error: 'Insurance not found' }, { status: 404 })
  } catch (error) {
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}