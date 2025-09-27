import { NextResponse } from 'next/server'

export async function GET() {
  // Mock pharmacy dashboard stats
  const stats = {
    totalProducts: 1250,
    lowStockItems: 23,
    todaySales: 145000,
    monthlyRevenue: 3200000,
    totalCustomers: 890,
    activeStaff: 8,
    pendingOrders: 12,
    expiringProducts: 15
  }

  return NextResponse.json(stats)
}