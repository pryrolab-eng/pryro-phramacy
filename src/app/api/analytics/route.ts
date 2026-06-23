import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { prisma } from "@/lib/db/prisma";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";

function decimalToNumber(value: unknown): number {
  if (value == null) return 0;
  return Number(value);
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function sumSales(rows: Array<{ total_amount: unknown }>): number {
  return rows.reduce((sum, row) => sum + decimalToNumber(row.total_amount), 0);
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireSessionPharmacyId(user.id);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const recentSales = await prisma.sales.findMany({
      where: {
        pharmacy_id: pharmacyId,
        created_at: { gte: ninetyDaysAgo },
      },
      select: { total_amount: true, created_at: true },
      orderBy: { created_at: "asc" },
    });

    const daily: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = startOfDay(new Date(now.getTime() - i * 24 * 60 * 60 * 1000));
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const total = sumSales(
        recentSales.filter(
          (sale) =>
            sale.created_at &&
            sale.created_at >= dayStart &&
            sale.created_at < dayEnd,
        ),
      );
      daily.push(Math.round(total));
    }

    const weekly: number[] = [];
    for (let w = 3; w >= 0; w--) {
      const weekEnd = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
      const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
      const total = sumSales(
        recentSales.filter(
          (sale) =>
            sale.created_at &&
            sale.created_at >= weekStart &&
            sale.created_at < weekEnd,
        ),
      );
      weekly.push(Math.round(total));
    }

    const monthly: number[] = [];
    for (let m = 2; m >= 0; m--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - m + 1, 1);
      const total = sumSales(
        recentSales.filter(
          (sale) =>
            sale.created_at &&
            sale.created_at >= monthStart &&
            sale.created_at < monthEnd,
        ),
      );
      monthly.push(Math.round(total));
    }

    const topProductRows = await prisma.sale_items.groupBy({
      by: ["inventory_id"],
      where: {
        sales: { pharmacy_id: pharmacyId, created_at: { gte: thirtyDaysAgo } },
      },
      _sum: { quantity: true, total_price: true },
      orderBy: { _sum: { total_price: "desc" } },
      take: 5,
    });

    const inventoryIds = topProductRows
      .map((row) => row.inventory_id)
      .filter((id): id is string => Boolean(id));

    const inventoryNames =
      inventoryIds.length > 0
        ? await prisma.inventory.findMany({
            where: { id: { in: inventoryIds } },
            select: {
              id: true,
              medications: { select: { name: true } },
            },
          })
        : [];

    const nameByInventory = new Map(
      inventoryNames.map((row) => [row.id, row.medications?.name ?? "Unknown"]),
    );

    const topProducts = topProductRows.map((row) => ({
      name: nameByInventory.get(row.inventory_id ?? "") ?? "Unknown",
      sales: Math.round(decimalToNumber(row._sum.total_price)),
      quantity: Number(row._sum.quantity ?? 0),
      growth: 0,
    }));

    const [customerCount, newCustomers, salesLast30] = await Promise.all([
      prisma.customers.count({ where: { pharmacy_id: pharmacyId } }),
      prisma.customers.count({
        where: { pharmacy_id: pharmacyId, created_at: { gte: thirtyDaysAgo } },
      }),
      prisma.sales.findMany({
        where: { pharmacy_id: pharmacyId, created_at: { gte: thirtyDaysAgo } },
        select: { total_amount: true, customer_name: true },
      }),
    ]);

    const totalRevenue30 = sumSales(salesLast30);
    const orderCount30 = salesLast30.length || 1;

    const last30Revenue = sumSales(
      recentSales.filter(
        (sale) => sale.created_at && sale.created_at >= thirtyDaysAgo,
      ),
    );
    const prev30Revenue = sumSales(
      recentSales.filter(
        (sale) =>
          sale.created_at &&
          sale.created_at >= new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000) &&
          sale.created_at < thirtyDaysAgo,
      ),
    );
    const growthFactor =
      prev30Revenue > 0 ? last30Revenue / prev30Revenue : 1;

    const stockNeeded = await prisma.sale_items.groupBy({
      by: ["inventory_id"],
      where: {
        sales: { pharmacy_id: pharmacyId, created_at: { gte: thirtyDaysAgo } },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 3,
    });

    return NextResponse.json({
      salesTrends: { daily, weekly, monthly },
      topProducts,
      customerInsights: {
        totalCustomers: customerCount,
        newCustomers,
        returningCustomers: Math.max(customerCount - newCustomers, 0),
        averageOrderValue: Math.round(totalRevenue30 / orderCount30),
      },
      predictions: {
        nextMonthSales: Math.round(last30Revenue * growthFactor),
        stockNeeded: stockNeeded.map((row) => ({
          product: nameByInventory.get(row.inventory_id ?? "") ?? "Unknown",
          predicted: Math.ceil(Number(row._sum.quantity ?? 0) * growthFactor),
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/analytics", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
