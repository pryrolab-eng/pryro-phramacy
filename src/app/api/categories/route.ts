import { NextRequest, NextResponse } from 'next/server'

let categories = [
  { id: '1', name: "Prescription Medications", description: "Medications requiring prescription", is_active: true },
  { id: '2', name: "Over-the-Counter", description: "Non-prescription medications", is_active: true },
  { id: '3', name: "Supplements", description: "Vitamins and dietary supplements", is_active: true },
  { id: '4', name: "Medical Devices", description: "Medical equipment and devices", is_active: true },
  { id: '5', name: "Personal Care", description: "Personal hygiene products", is_active: true },
  { id: '6', name: "Baby Care", description: "Baby and infant care products", is_active: true },
]

export async function GET() {
  return NextResponse.json(categories)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const newCategory = {
      id: Date.now().toString(),
      name: body.name,
      description: body.description,
      is_active: true
    }

    categories.push(newCategory)

    return NextResponse.json({ success: true, category: newCategory })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to add category' })
  }
}