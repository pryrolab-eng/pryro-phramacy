import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requirePlatformAdminApi } from '@/lib/admin/require-platform-admin'

export async function GET() {
  try {
    const auth = await requirePlatformAdminApi()
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const [pharmacies, users, sales] = await Promise.all([
      prisma.pharmacies.findMany({
        select: { id: true, status: true, created_at: true },
      }),
      prisma.pharmacy_users.findMany({
        select: { id: true, created_at: true },
      }),
      prisma.sales.findMany({
        select: { total_amount: true },
      }),
    ])

    const totalPharmacies = pharmacies.length
    const activePharmacies = pharmacies.filter((p) => p.status === 'active').length
    const totalRevenue = sales.reduce(
      (sum, sale) => sum + Number(sale.total_amount ?? 0),
      0,
    )
    const totalUsers = users.length

    const thisMonth = new Date().getMonth()
    const newRegistrations = pharmacies.filter(
      (p) => p.created_at && new Date(p.created_at).getMonth() === thisMonth,
    ).length

    return NextResponse.json({
      totalPharmacies,
      activePharmacies,
      totalRevenue,
      monthlyGrowth: 15.2,
      totalUsers,
      newRegistrations,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
