import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { requireUserBranchId } from "@/lib/pharmacy/get-session-branch";
import {
  entitlementRouteResponse,
  guardInventoryAccessForUser,
} from "@/lib/subscription/route-guards";
import { storeAddMedicationInventory } from "@/lib/db/inventory-store";
import { cacheDelByPrefix } from "@/lib/cache/redis-cache";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" });
    }

    try {
      await guardInventoryAccessForUser(user.id);
    } catch (entErr) {
      const res = entitlementRouteResponse(entErr);
      if (res) return res;
      throw entErr;
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const branchId = await requireUserBranchId(user.id);
    const body = await request.json();

    const result = await storeAddMedicationInventory({
      ...body,
      pharmacyId,
      branchId,
    });

    if (result.success) {
      void cacheDelByPrefix(`inventory:${pharmacyId}`);
      void cacheDelByPrefix(`dashboard:${pharmacyId}`);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/inventory/add", error);
    return NextResponse.json({
      success: false,
      error: "Failed to add medication",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
