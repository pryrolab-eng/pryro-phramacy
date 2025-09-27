import { NextResponse } from 'next/server'

export async function GET() {
  const expiryAlerts = [
    { id: '1', product: 'Aspirin 100mg', batchNumber: 'ASP001', expiryDate: '2024-01-15', daysUntilExpiry: 5, quantity: 50, priority: 'high' },
    { id: '2', product: 'Vitamin C 500mg', batchNumber: 'VTC002', expiryDate: '2024-01-20', daysUntilExpiry: 10, quantity: 30, priority: 'medium' },
    { id: '3', product: 'Cough Syrup', batchNumber: 'CS003', expiryDate: '2024-01-25', daysUntilExpiry: 15, quantity: 12, priority: 'medium' }
  ]
  return NextResponse.json(expiryAlerts)
}