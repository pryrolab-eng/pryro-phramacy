import { NextResponse } from 'next/server'

export async function GET() {
  const accounting = {
    revenue: 2450000,
    expenses: 1200000,
    profit: 1250000,
    profitMargin: 51.0,
    monthlyBreakdown: [
      { month: 'Jan', revenue: 800000, expenses: 400000, profit: 400000 },
      { month: 'Feb', revenue: 850000, expenses: 420000, profit: 430000 },
      { month: 'Mar', revenue: 800000, expenses: 380000, profit: 420000 }
    ],
    expenseCategories: [
      { category: 'Inventory', amount: 800000 },
      { category: 'Staff Salaries', amount: 250000 },
      { category: 'Utilities', amount: 80000 },
      { category: 'Rent', amount: 70000 }
    ]
  }
  return NextResponse.json(accounting)
}