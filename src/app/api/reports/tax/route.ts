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
  buildTaxSummary,
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

    const totalSales = sales.reduce((sum, row) => sum + row.total_amount, 0);
    const vatSummary = buildTaxSummary(totalSales);

    const transactions = sales.slice(-50).map((row) => ({
      date: row.created_at.split("T")[0],
      invoice: row.id,
      amount: row.total_amount,
      vat: Math.round(row.total_amount * 0.18),
      customer: row.customer_name ?? "Walk-in Customer",
    }));

    return NextResponse.json({
      period: formatReportPeriod(range),
      vatSummary,
      transactions,
      rraSubmission: {
        status: "not_connected",
        note: "Live RRA submission requires EBM integration — see ebm-integration-decision-brief.md",
      },
    });
  } catch (error) {
    console.error("GET /api/reports/tax", error);
    return NextResponse.json(
      { error: "Failed to build tax report" },
      { status: 500 },
    );
  }
}
