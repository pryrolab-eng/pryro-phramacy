import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { parseBranchScopeFromRequest } from "@/lib/pharmacy/branch-scope";
import { defaultReportRange } from "@/lib/pharmacy/branch-scope";
import {
  storeGetSalesReport,
  storeGetInventoryReport,
  storeGetCategorySales,
  storeGetPharmacyDashboardStats,
} from "@/lib/db/reports-store";
import { cacheGet, cacheSet } from "@/lib/cache/redis-cache";

const REDIS_TTL = 300;

async function getCachedReportsData(
  userId: string,
  pharmacyId: string,
  branchId: string | null,
) {
  const cacheKey = `reports:${pharmacyId}:${branchId ?? "all"}`;

  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const range = defaultReportRange(30);
  const today = new Date().toISOString().split("T")[0];
  const branchScope = branchId ?? undefined;

  const [salesReport, inventoryReport, categorySales, dashboardStats] = await Promise.all([
    storeGetSalesReport({ pharmacyId, branchId: branchScope }, range),
    storeGetInventoryReport(pharmacyId),
    storeGetCategorySales({ pharmacyId, branchId: branchScope }),
    storeGetPharmacyDashboardStats({ pharmacyId, branchId: branchScope }, range, today),
  ]);

  const data = { salesReport, inventoryReport, categorySales, dashboardStats };
  await cacheSet(cacheKey, data, REDIS_TTL);

  return data;
}

const getCachedReportsDataCached = unstable_cache(
  getCachedReportsData,
  ["pharmacy-reports"],
  { revalidate: 300, tags: ["pharmacy-reports"] },
);

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const scope = parseBranchScopeFromRequest(request);

    const data = await getCachedReportsDataCached(user.id, pharmacyId, scope.branchId ?? null);

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/reports/combined", error);
    return NextResponse.json(
      {
        salesReport: { totalSales: 0, totalRevenue: 0, topProducts: [] },
        inventoryReport: { inventoryAlerts: [] },
        categorySales: [],
        dashboardStats: {
          totalProducts: 0, lowStockItems: 0, todaySales: 0, monthlyRevenue: 0,
          totalCustomers: 0, activeStaff: 0, pendingOrders: 0, expiringProducts: 0
        },
      },
      { status: 200 },
    );
  }
}