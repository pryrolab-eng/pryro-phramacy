import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  defaultReportRange,
  parseBranchScopeFromRequest,
} from "@/lib/pharmacy/branch-scope";
import {
  emptyCombinedDashboard,
  loadCombinedDashboardData,
} from "@/lib/pharmacy/load-combined-dashboard";

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

    const getCachedData = unstable_cache(
      async () =>
        loadCombinedDashboardData(pharmacyId, scope.branchId, range),
      [`dashboard-${pharmacyId}-${scope.branchId ?? "all"}`],
      { revalidate: 600, tags: [`dashboard-${pharmacyId}`] },
    );

    const data = await getCachedData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/pharmacy/dashboard/combined", error);
    return NextResponse.json(emptyCombinedDashboard(), { status: 200 });
  }
}
