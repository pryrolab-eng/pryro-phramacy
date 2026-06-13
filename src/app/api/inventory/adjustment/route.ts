import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import {
  entitlementRouteResponse,
  guardInventoryAccessForUser,
} from "@/lib/subscription/route-guards";
import { storeAdjustInventoryQuantity } from "@/lib/db/inventory-store";

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

    const { productId, quantity, adjustmentType } = await request.json();
    const newStock = await storeAdjustInventoryQuantity(
      productId,
      adjustmentType === "increase" ? "increase" : "decrease",
      quantity,
    );

    return NextResponse.json({ success: true, newStock });
  } catch (error) {
    console.error("POST /api/inventory/adjustment", error);
    const message = error instanceof Error ? error.message : "Adjustment failed";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
