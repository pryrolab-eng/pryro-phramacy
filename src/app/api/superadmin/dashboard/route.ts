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

    const now = new Date()
    const thisMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
    const previousMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
    const newRegistrations = pharmacies.filter(
      (p) =>
        p.created_at &&
        p.created_at >= thisMonthStart &&
        p.created_at < nextMonthStart,
    ).length
    const previousRegistrations = pharmacies.filter(
      (p) =>
        p.created_at &&
        p.created_at >= previousMonthStart &&
        p.created_at < thisMonthStart,
    ).length
    const monthlyGrowth =
      previousRegistrations > 0
        ? Math.round(
            ((newRegistrations - previousRegistrations) /
              previousRegistrations) *
              1000,
          ) / 10
        : newRegistrations > 0
          ? 100
          : 0

    return NextResponse.json({
      totalPharmacies,
      activePharmacies,
      totalRevenue,
      monthlyGrowth,
      totalUsers,
      newRegistrations,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
