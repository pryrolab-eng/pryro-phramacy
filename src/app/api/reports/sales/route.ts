import { NextResponse } from 'next/server'

export async function GET() {
  const salesReport = {
    totalSales: 2450000,
    todaySales: 145000,
    monthlyGrowth: 15.2,
    topProducts: [
      { name: 'Paracetamol 500mg', sales: 450000, quantity: 1200 },
      { name: 'Amoxicillin 250mg', sales: 380000, quantity: 950 },
      { name: 'Vitamin C', sales: 220000, quantity: 800 }
    ],
    salesByInsurance: [
      { insurance: 'RSSB', amount: 850000 },
      { insurance: 'MMI', amount: 620000 },
      { insurance: 'Cash', amount: 980000 }
    ],
    dailySales: [
      { date: '2024-01-01', amount: 125000 },
      { date: '2024-01-02', amount: 135000 },
      { date: '2024-01-03', amount: 145000 }
    ]
  }
  
  return NextResponse.json(salesReport)
}