import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  defaultReportRange,
  parseBranchScopeFromRequest,
} from "@/lib/pharmacy/branch-scope";
import {
  entitlementRouteResponse,
  guardReportsAccessForUser,
} from "@/lib/subscription/route-guards";
import { storeGetSalesReport } from "@/lib/db/reports-store";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      await guardReportsAccessForUser(user.id);
    } catch (entErr) {
      const res = entitlementRouteResponse(entErr);
      if (res) return res;
      throw entErr;
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const scope = parseBranchScopeFromRequest(request);
    const range =
      scope.from && scope.to
        ? { from: scope.from, to: scope.to }
        : defaultReportRange(30);

    const report = await storeGetSalesReport(
      { pharmacyId, branchId: scope.branchId },
      range,
    );

    return NextResponse.json(report);
  } catch (error) {
    console.error("GET /api/reports/sales", error);
    return NextResponse.json({
      dailySales: [],
      topProducts: [],
      paymentBreakdown: [],
      totalSales: 0,
      totalOrders: 0,
      activeCustomers: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
