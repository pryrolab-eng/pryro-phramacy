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
import { buildAccountingSummary } from "@/lib/db/accounting";

function exclusiveEndDate(date: string): Date {
  const end = new Date(date);
  end.setUTCDate(end.getUTCDate() + 1);
  return end;
}

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
    const accounting = await buildAccountingSummary({
      pharmacyId,
      range: { from: new Date(range.from), to: exclusiveEndDate(range.to) },
    });

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
        inventory: accounting.categories.inventory,
        supplierPurchases: accounting.categories.supplierPurchases,
        salaries: accounting.categories.salaries,
        utilities: accounting.categories.utilities,
        rent: accounting.categories.rent,
        other: accounting.categories.other,
        total: accounting.expenses,
        categories: accounting.categoryBreakdown,
        sources: accounting.sources,
        note:
          "Expenses use purchase orders and estimated staff salaries. Rent, utilities, and fiscal submission data are reserved extension points.",
      },
      profitLoss: {
        grossProfit: revenue.totalSales - accounting.categories.inventory,
        netProfit: accounting.profit,
        profitMargin: accounting.profitMargin,
      },
      cashFlow: {
        opening: 0,
        inflow: accounting.cashFlow.inflow,
        outflow: accounting.cashFlow.outflow,
        closing: accounting.cashFlow.net,
        note:
          "Cash flow is derived from sales, completed payments, payment transactions, purchase orders, and salary estimates.",
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
