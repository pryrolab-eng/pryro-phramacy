import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { parseBranchScopeFromRequest } from "@/lib/pharmacy/branch-scope";
import { defaultReportRange } from "@/lib/pharmacy/branch-scope";
import { resolveRequestBranchScope } from "@/lib/pharmacy/get-session-branch";
import {
  storeGetSalesReport,
  storeGetSalesChart,
  storeGetWeeklySales,
  storeGetCategorySales,
} from "@/lib/db/reports-store";
import { cacheGet, cacheSet } from "@/lib/cache/redis-cache";

const REDIS_TTL = 300;

async function getCachedSalesData(
  userId: string,
  pharmacyId: string,
  branchId: string | null,
) {
  const cacheKey = `sales:${pharmacyId}:${branchId ?? "all"}`;

  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const range = defaultReportRange(30);
  const branchScope = branchId ?? undefined;

  const [salesReport, salesChart, weeklySales, categorySales] =
    await Promise.all([
      storeGetSalesReport({ pharmacyId, branchId: branchScope }, range),
      storeGetSalesChart({ pharmacyId, branchId: branchScope }),
      storeGetWeeklySales({ pharmacyId, branchId: branchScope }),
      storeGetCategorySales({ pharmacyId, branchId: branchScope }),
    ]);

  const data = { salesReport, salesChart, weeklySales, categorySales };
  await cacheSet(cacheKey, data, REDIS_TTL);

  return data;
}

const getCachedSalesDataCached = unstable_cache(
  getCachedSalesData,
  ["pharmacy-sales"],
  { revalidate: 300, tags: ["pharmacy-sales"] },
);

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const scope = parseBranchScopeFromRequest(request);
    const { pharmacyId, branchId } = await resolveRequestBranchScope(
      user.id,
      scope.branchId,
    );

    const data = await getCachedSalesDataCached(user.id, pharmacyId, branchId);

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/sales/combined", error);
    return NextResponse.json(
      {
        salesReport: { totalSales: 0, totalRevenue: 0, topProducts: [] },
        salesChart: [],
        weeklySales: [],
        categorySales: [],
      },
      { status: 200 },
    );
  }
}
