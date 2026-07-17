import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { requireAllowedRequestBranchId } from "@/lib/pharmacy/get-session-branch";
import { parseBranchScopeFromRequest } from "@/lib/pharmacy/branch-scope";
import { storeListPosProducts } from "@/lib/db/pos-store";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json([]);
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const scope = parseBranchScopeFromRequest(request);
    const branchId = await requireAllowedRequestBranchId(
      user.id,
      scope.branchId,
    );

    const products = await storeListPosProducts(pharmacyId, branchId);

    return NextResponse.json(products);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error fetching products";
    console.error("Error fetching products:", error);
    if (message.includes("No active branch") || message.includes("assign you")) {
      return NextResponse.json(
        { error: message, code: "NO_ACTIVE_BRANCH" },
        { status: 400 },
      );
    }
    if (message.includes("do not have access")) {
      return NextResponse.json(
        { error: message, code: "BRANCH_FORBIDDEN" },
        { status: 403 },
      );
    }
    if (message.includes("Pharmacy not found")) {
      return NextResponse.json(
        { error: message, code: "NO_PHARMACY" },
        { status: 403 },
      );
    }
    return NextResponse.json([]);
  }
}
