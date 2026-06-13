import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserBranchId } from "@/lib/pharmacy/get-session-branch";
import {
  guardPharmacyFeatureForUser,
  handleEntitlementRouteError,
} from "@/lib/subscription/api-guard";
import { storeSearchPosPriceCheck } from "@/lib/db/pos-store";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";
    const branchParam = searchParams.get("branchId")?.trim();

    const { pharmacyId } = await guardPharmacyFeatureForUser(user.id, {
      feature: "pos.access",
      branchId: branchParam || undefined,
    });

    let branchId = branchParam;
    if (!branchId) {
      try {
        branchId = await requireUserBranchId(user.id);
      } catch {
        branchId = undefined;
      }
    }

    const results = await storeSearchPosPriceCheck({
      pharmacyId,
      branchId,
      query,
    });

    return NextResponse.json(results);
  } catch (error) {
    const entitlement = handleEntitlementRouteError(error);
    if (entitlement) return entitlement;
    console.error("GET /api/pos/price-check", error);
    return NextResponse.json([]);
  }
}
