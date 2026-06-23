import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { parseBranchScopeFromRequest } from "@/lib/pharmacy/branch-scope";
import { storeGetWeeklySales } from "@/lib/db/reports-store";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json([]);

    const pharmacyId = await requireUserPharmacyId(user.id);
    const scope = parseBranchScopeFromRequest(request);
    const chartData = await storeGetWeeklySales({
      pharmacyId,
      branchId: scope.branchId,
    });

    return NextResponse.json(chartData);
  } catch (error) {
    console.error("GET /api/pharmacy/weekly-sales", error);
    return NextResponse.json([]);
  }
}
