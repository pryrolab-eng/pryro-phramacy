import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') || new Date().getMonth() + 1
  const year = searchParams.get('year') || new Date().getFullYear()

  const claims = [
    {
      id: 'CLM001',
      insuranceType: 'RAMA',
      patientName: 'Jean Uwimana',
      insuranceNumber: 'INS001',
      date: '2024-01-15',
      items: [
        { drug: 'Paracetamol 500mg', quantity: 2, unitPrice: 1000, insurancePays: 2000, patientPays: 0 }
      ],
      totalClaim: 2000,
      status: 'pending'
    },
    {
      id: 'CLM002',
      insuranceType: 'MMI',
      patientName: 'Marie Mukamana',
      insuranceNumber: 'INS002',
      date: '2024-01-16',
      items: [
        { drug: 'Amoxicillin 250mg', quantity: 1, unitPrice: 1200, insurancePays: 1020, patientPays: 180 }
      ],
      totalClaim: 1020,
      status: 'approved'
    }
  ]

  const summary = {
    totalClaims: claims.length,
    totalAmount: claims.reduce((sum, claim) => sum + claim.totalClaim, 0),
    byInsurance: {
      RAMA: claims.filter(c => c.insuranceType === 'RAMA').reduce((sum, c) => sum + c.totalClaim, 0),
      MMI: claims.filter(c => c.insuranceType === 'MMI').reduce((sum, c) => sum + c.totalClaim, 0),
      RSSB: claims.filter(c => c.insuranceType === 'RSSB').reduce((sum, c) => sum + c.totalClaim, 0)
    }
  }

  return NextResponse.json({ claims, summary, month, year })
}
