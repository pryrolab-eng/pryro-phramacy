import { NextResponse } from 'next/server'

export async function GET() {
  const inventoryReport = {
    totalProducts: 1250,
    totalValue: 3200000,
    lowStockItems: 23,
    expiringItems: 15,
    categoryBreakdown: [
      { category: 'Pain Relief', count: 320, value: 1200000 },
      { category: 'Antibiotics', count: 180, value: 850000 },
      { category: 'Vitamins', count: 240, value: 650000 },
      { category: 'Prescription', count: 150, value: 2100000 }
    ],
    stockMovements: [
      { date: '2024-01-01', type: 'in', quantity: 150, product: 'Paracetamol 500mg' },
      { date: '2024-01-02', type: 'out', quantity: 25, product: 'Amoxicillin 250mg' }
    ]
  }
  
  return NextResponse.json(inventoryReport)
}