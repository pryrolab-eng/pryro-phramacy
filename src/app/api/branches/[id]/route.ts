import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    return NextResponse.json({ success: true, branch: { id: params.id, ...body } })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update branch' }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const mockInventory = [
      { id: '1', name: 'Paracetamol 500mg', stock: 100, price: 500 },
      { id: '2', name: 'Amoxicillin 250mg', stock: 50, price: 1200 }
    ]
    return NextResponse.json(mockInventory)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch branch inventory' }, { status: 500 })
  }
}