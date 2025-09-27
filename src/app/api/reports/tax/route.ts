import { NextResponse } from 'next/server'

export async function GET() {
  const taxReport = {
    period: 'January 2024',
    vatSummary: {
      totalSales: 2450000,
      vatableSales: 2200000,
      vatAmount: 396000,
      vatRate: 18
    },
    transactions: [
      { date: '2024-01-10', invoice: 'INV-001', amount: 25000, vat: 4500, customer: 'John Doe' },
      { date: '2024-01-11', invoice: 'INV-002', amount: 15000, vat: 2700, customer: 'Jane Smith' }
    ],
    rraSubmission: {
      status: 'pending',
      dueDate: '2024-02-15',
      lastSubmitted: '2023-12-15'
    }
  }
  return NextResponse.json(taxReport)
}