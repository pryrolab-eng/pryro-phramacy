import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { parseBranchScopeFromRequest } from "@/lib/pharmacy/branch-scope";
import { fetchRecentPosSalesRows } from "@/lib/db/reports";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json([]);
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const scope = parseBranchScopeFromRequest(request);
    const formattedSales = await fetchRecentPosSalesRows(
      {
        pharmacyId,
        branchId: scope.branchId,
      },
      5,
    );

    return NextResponse.json(formattedSales);
  } catch (error) {
    console.error("GET /api/pos", error);
    return NextResponse.json([]);
  }
}
