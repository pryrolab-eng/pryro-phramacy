import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const drugs = [
    { id: '1', name: 'Paracetamol 500mg', stock: 150, minStock: 20, price: 500, expiryDate: '2024-12-31' },
    { id: '2', name: 'Amoxicillin 250mg', stock: 0, minStock: 15, price: 1200, expiryDate: '2024-11-30' },
    { id: '3', name: 'Ibuprofen 400mg', stock: 8, minStock: 25, price: 800, expiryDate: '2024-10-15' }
  ]
  
  return NextResponse.json(drugs)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, stock, minStock, price, expiryDate, batchNumber } = body
    
    const newDrug = {
      id: Date.now().toString(),
      name,
      stock: parseInt(stock),
      minStock: parseInt(minStock),
      price: parseFloat(price),
      expiryDate,
      batchNumber,
      createdAt: new Date().toISOString()
    }
    
    return NextResponse.json({ success: true, drug: newDrug }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add drug' }, { status: 500 })
  }
}
