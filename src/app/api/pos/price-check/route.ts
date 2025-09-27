import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  
  const products = [
    { name: 'Paracetamol 500mg', price: 500, stock: 100, barcode: '1234567890123' },
    { name: 'Amoxicillin 250mg', price: 1200, stock: 50, barcode: '1234567890124' }
  ]
  
  const results = query ? products.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase()) || 
    p.barcode.includes(query)
  ) : products
  
  return NextResponse.json(results)
}