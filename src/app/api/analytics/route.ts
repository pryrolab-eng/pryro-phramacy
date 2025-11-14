import { NextResponse } from 'next/server'

export async function GET() {
  const analytics = {
    salesTrends: {
      daily: [120000, 135000, 145000, 128000, 155000, 142000, 138000],
      weekly: [850000, 920000, 880000, 945000],
      monthly: [2450000, 2680000, 2520000]
    },
    topProducts: [
      { name: 'Paracetamol 500mg', sales: 450000, quantity: 1200, growth: 15.2 },
      { name: 'Amoxicillin 250mg', sales: 380000, quantity: 950, growth: 8.7 },
      { name: 'Vitamin C', sales: 220000, quantity: 800, growth: 22.1 }
    ],
    customerInsights: {
      totalCustomers: 890,
      newCustomers: 45,
      returningCustomers: 845,
      averageOrderValue: 18500
    },
    predictions: {
      nextMonthSales: 2750000,
      stockNeeded: [
        { product: 'Paracetamol 500mg', predicted: 1400 },
        { product: 'Amoxicillin 250mg', predicted: 1100 }
      ]
    }
  }
  return NextResponse.json(analytics)
}
