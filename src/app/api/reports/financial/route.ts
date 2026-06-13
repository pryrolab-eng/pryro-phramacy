import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { fetchSalesReportRows } from "@/lib/db/reports";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  defaultReportRange,
  parseBranchScopeFromRequest,
} from "@/lib/pharmacy/branch-scope";
import {
  entitlementRouteResponse,
  guardReportsAccessForUser,
} from "@/lib/subscription/route-guards";
import {
  aggregateRevenueByPaymentMethod,
  formatReportPeriod,
} from "@/lib/reports/extended-reports";

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

    const sales = await fetchSalesReportRows(
      { pharmacyId, branchId: scope.branchId },
      range,
    );
    const revenue = aggregateRevenueByPaymentMethod(sales);

    return NextResponse.json({
      period: formatReportPeriod(range),
      revenue: {
        totalSales: revenue.totalSales,
        cashSales: revenue.cashSales,
        insuranceSales: revenue.insuranceSales,
        mobileMoneySales: revenue.mobileMoneySales,
        cardSales: revenue.cardSales,
        mixedSales: revenue.mixedSales,
      },
      expenses: {
        inventory: 0,
        salaries: 0,
        utilities: 0,
        rent: 0,
        other: 0,
        note: "Expense tracking is not implemented; revenue figures are live from sales.",
      },
      profitLoss: {
        grossProfit: revenue.totalSales,
        netProfit: revenue.totalSales,
        profitMargin:
          revenue.totalSales > 0
            ? Math.round((revenue.totalSales / revenue.totalSales) * 1000) / 10
            : 0,
      },
      cashFlow: {
        opening: 0,
        inflow: revenue.totalSales,
        outflow: 0,
        closing: revenue.totalSales,
        note: "Cash flow uses sales inflow only until expense ledger ships.",
      },
    });
  } catch (error) {
    console.error("GET /api/reports/financial", error);
    return NextResponse.json(
      { error: "Failed to build financial report" },
      { status: 500 },
    );
  }
}
