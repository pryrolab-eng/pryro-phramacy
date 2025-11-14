import { NextResponse } from 'next/server'

export async function GET() {
  const financialReport = {
    period: 'January 2024',
    revenue: {
      totalSales: 2450000,
      cashSales: 1200000,
      insuranceSales: 850000,
      mobileMoneySales: 400000
    },
    expenses: {
      inventory: 1200000,
      salaries: 300000,
      utilities: 80000,
      rent: 120000,
      other: 50000
    },
    profitLoss: {
      grossProfit: 1250000,
      netProfit: 700000,
      profitMargin: 28.6
    },
    cashFlow: {
      opening: 500000,
      inflow: 2450000,
      outflow: 1750000,
      closing: 1200000
    }
  }
  return NextResponse.json(financialReport)
}
