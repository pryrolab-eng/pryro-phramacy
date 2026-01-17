import { NextRequest, NextResponse } from 'next/server'

const drugInteractions: { [key: string]: string[] } = {
  'paracetamol': ['warfarin', 'alcohol'],
  'ibuprofen': ['aspirin', 'warfarin'],
  'aspirin': ['ibuprofen', 'warfarin'],
  'amoxicillin': ['methotrexate'],
  'warfarin': ['aspirin', 'ibuprofen', 'paracetamol']
}

const drugWarnings: { [key: string]: string } = {
  'paracetamol': 'Max 4g/day. Liver toxicity risk with alcohol',
  'ibuprofen': 'Take with food. Risk of stomach bleeding',
  'aspirin': 'Blood thinner. Avoid before surgery',
  'amoxicillin': 'Complete full course. Check penicillin allergy'
}

export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json()

    if (!items || items.length === 0) {
      return NextResponse.json({
        success: true,
        result: {
          interactions: [],
          warnings: ['No items to analyze'],
          recommendations: ['Add items to cart for safety check'],
          severity: 'safe'
        }
      })
    }

    const interactions: string[] = []
    const warnings: string[] = []
    const recommendations: string[] = []
    let severity: 'safe' | 'caution' | 'danger' = 'safe'

    const drugNames = items.map((item: any) => 
      item.name.toLowerCase().split(' ')[0]
    )

    for (let i = 0; i < drugNames.length; i++) {
      const drug1 = drugNames[i]
      const interactsWith = drugInteractions[drug1] || []

      for (let j = i + 1; j < drugNames.length; j++) {
        const drug2 = drugNames[j]
        if (interactsWith.includes(drug2)) {
          interactions.push(`⚠️ ${items[i].name} may interact with ${items[j].name}`)
          severity = 'danger'
        }
      }

      if (drugWarnings[drug1]) {
        warnings.push(`${items[i].name}: ${drugWarnings[drug1]}`)
      }
    }

    if (interactions.length === 0) {
      recommendations.push('✓ No known drug interactions detected')
    } else {
      recommendations.push('⚠️ Consult pharmacist about interactions')
    }

    recommendations.push('✓ Verify patient allergies before dispensing')
    recommendations.push('✓ Confirm dosage with prescription')

    items.forEach((item: any) => {
      if (item.quantity > 10) {
        warnings.push(`High quantity of ${item.name} (${item.quantity} units)`)
        severity = severity === 'safe' ? 'caution' : severity
      }
    })

    return NextResponse.json({
      success: true,
      result: {
        interactions,
        warnings: warnings.length > 0 ? warnings : ['No specific warnings'],
        recommendations,
        severity
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Safety check failed' },
      { status: 500 }
    )
  }
}
