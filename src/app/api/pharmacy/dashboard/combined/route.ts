import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  defaultReportRange,
  parseBranchScopeFromRequest,
} from "@/lib/pharmacy/branch-scope";
import {
  storeGetPharmacyDashboardStats,
} from "@/lib/db/reports-store";
import { fetchRecentPosSalesRows } from "@/lib/db/reports";
import { storeStockAlerts } from "@/lib/db/inventory-store";
import {
  storeGetSalesChart,
  storeGetWeeklySales,
  storeGetCategorySales,
  storeGetInventoryChart,
} from "@/lib/db/reports-store";
import { cacheGet, cacheSet } from "@/lib/cache/redis-cache";

const REDIS_TTL = 300; // 5 minutes

async function getCachedDashboardData(
  pharmacyId: string,
  branchId: string | undefined,
  range: { from: string; to: string },
  today: string,
) {
  const cacheKey = `dashboard:${pharmacyId}:${branchId ?? "all"}:${today}`;

  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const [
    stats,
    recentSales,
    stockAlerts,
    salesChart,
    weeklySales,
    categorySales,
    inventoryChart,
  ] = await Promise.all([
    storeGetPharmacyDashboardStats(
      { pharmacyId, branchId },
      range,
      today,
    ),
    fetchRecentPosSalesRows(
      { pharmacyId, branchId },
      5,
    ),
    storeStockAlerts(pharmacyId, branchId),
    storeGetSalesChart({ pharmacyId, branchId }),
    storeGetWeeklySales({ pharmacyId, branchId }),
    storeGetCategorySales({ pharmacyId, branchId }),
    storeGetInventoryChart(pharmacyId),
  ]);

  const data = {
    stats,
    recentSales,
    stockAlerts,
    salesChart,
    weeklySales,
    categorySales,
    inventoryChart,
  };

  await cacheSet(cacheKey, data, REDIS_TTL);

  return data;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const scope = parseBranchScopeFromRequest(request);
    const range =
      scope.from && scope.to
        ? { from: scope.from, to: scope.to }
        : defaultReportRange(30);

    const today = new Date().toISOString().split("T")[0];

    const getCachedData = unstable_cache(
      getCachedDashboardData,
      [`dashboard-${pharmacyId}-${scope.branchId ?? "all"}`],
      { revalidate: 600, tags: [`dashboard-${pharmacyId}`] },
    );

    const data = await getCachedData(pharmacyId, scope.branchId, range, today);

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/pharmacy/dashboard/combined", error);
    return NextResponse.json(
      {
        stats: {
          totalProducts: 0,
          lowStockItems: 0,
          todaySales: 0,
          monthlyRevenue: 0,
          totalCustomers: 0,
          activeStaff: 0,
          pendingOrders: 0,
          expiringProducts: 0,
        },
        recentSales: [],
        stockAlerts: { all: [], lowStock: [], expiring: [] },
        salesChart: [],
        weeklySales: [],
        categorySales: [],
        inventoryChart: [],
      },
      { status: 200 },
    );
  }
}