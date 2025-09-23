import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const fastMoving = searchParams.get('fastMoving') === 'true'

  const products = [
    { id: '1', name: 'Paracetamol 500mg', price: 500, stock: 100, batch: 'PAR001', expiryDate: '2024-12-31', daysToExpiry: 365, barcode: '123456789', fastMoving: true },
    { id: '2', name: 'Amoxicillin 250mg', price: 1200, stock: 50, batch: 'AMX002', expiryDate: '2024-06-15', daysToExpiry: 180, barcode: '987654321', fastMoving: false },
    { id: '3', name: 'Ibuprofen 400mg', price: 800, stock: 75, batch: 'IBU003', expiryDate: '2024-01-20', daysToExpiry: 15, barcode: '456789123', fastMoving: true },
    { id: '4', name: 'Aspirin 100mg', price: 300, stock: 120, batch: 'ASP004', expiryDate: '2024-11-30', daysToExpiry: 330, barcode: '789123456', fastMoving: false },
    { id: '5', name: 'Vitamin C 500mg', price: 600, stock: 80, batch: 'VTC005', expiryDate: '2024-08-10', daysToExpiry: 220, barcode: '321654987', fastMoving: true }
  ]

  let filtered = products
  
  if (search) {
    filtered = products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search)
    )
  }
  
  if (fastMoving) {
    filtered = filtered.filter(p => p.fastMoving)
  }

  return NextResponse.json(filtered)
}