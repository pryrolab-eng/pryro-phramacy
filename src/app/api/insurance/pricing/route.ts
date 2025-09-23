import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const drugId = searchParams.get('drugId')
  const insuranceType = searchParams.get('insuranceType')

  const insurancePricing = {
    '1': {
      retail: 1000,
      RAMA: { coverage: 100, price: 1000 },
      MMI: { coverage: 85, price: 1000 },
      RSSB: { coverage: 90, price: 1000 },
      Radiant: { coverage: 80, price: 1000 }
    },
    '2': {
      retail: 1200,
      RAMA: { coverage: 100, price: 1200 },
      MMI: { coverage: 85, price: 1200 },
      RSSB: { coverage: 90, price: 1200 },
      Radiant: { coverage: 80, price: 1200 }
    }
  }

  if (drugId && insuranceType) {
    const pricing = insurancePricing[drugId as keyof typeof insurancePricing]
    if (pricing) {
      const insurance = pricing[insuranceType as keyof typeof pricing]
      if (insurance && typeof insurance === 'object') {
        return NextResponse.json({
          drugId,
          insuranceType,
          retailPrice: pricing.retail,
          insurancePrice: insurance.price,
          coveragePercent: insurance.coverage,
          insurancePays: (insurance.price * insurance.coverage) / 100,
          patientPays: insurance.price - (insurance.price * insurance.coverage) / 100
        })
      }
    }
  }

  return NextResponse.json({ error: 'Pricing not found' }, { status: 404 })
}