import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import {
  entitlementRouteResponse,
  guardInventoryAccessForUser,
} from "@/lib/subscription/route-guards";
import {
  storeAdjustInventoryQuantity,
  storeUpdateInventory,
} from "@/lib/db/inventory-store";
import { cacheDelByPrefix } from "@/lib/cache/redis-cache";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
      await guardInventoryAccessForUser(user.id);
    } catch (entErr) {
      const res = entitlementRouteResponse(entErr);
      if (res) return res;
      throw entErr;
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const { productId, quantity, costPrice } = await request.json();
    const newStock = await storeAdjustInventoryQuantity(
      productId,
      "increase",
      quantity,
    );

    if (costPrice != null) {
      await storeUpdateInventory(productId, { unit_cost: costPrice });
    }

    void cacheDelByPrefix(`inventory:${pharmacyId}`);
    void cacheDelByPrefix(`dashboard:${pharmacyId}`);

    return NextResponse.json({ success: true, newStock });
  } catch (error) {
    console.error("POST /api/inventory/purchase", error);
    const message = error instanceof Error ? error.message : "Purchase failed";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
