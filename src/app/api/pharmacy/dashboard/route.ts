import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  defaultReportRange,
  parseBranchScopeFromRequest,
} from "@/lib/pharmacy/branch-scope";
import { storeGetPharmacyDashboardStats } from "@/lib/db/reports-store";

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
    const stats = await storeGetPharmacyDashboardStats(
      {
        pharmacyId,
        branchId: scope.branchId,
      },
      range,
      today,
    );

    return NextResponse.json(stats);
  } catch (error) {
    console.error("GET /api/pharmacy/dashboard", error);
    return NextResponse.json({
      totalProducts: 0,
      lowStockItems: 0,
      todaySales: 0,
      monthlyRevenue: 0,
      totalCustomers: 0,
      activeStaff: 0,
      pendingOrders: 0,
      expiringProducts: 0,
    });
  }
}
