import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import {
  entitlementRouteResponse,
  guardInventoryAccessForUser,
} from "@/lib/subscription/route-guards";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { storeAdjustInventoryQuantity } from "@/lib/db/inventory-store";
import { auditRequestMetadata, writeAuditLog } from "@/lib/db/audit-logs";
import { cacheDelByPrefix } from "@/lib/cache/redis-cache";

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
    const { productId, quantity, adjustmentType, reason } = await request.json();
    const newStock = await storeAdjustInventoryQuantity(
      productId,
      adjustmentType === "increase" ? "increase" : "decrease",
      quantity,
    );

    await writeAuditLog({
      pharmacyId,
      userId: user.id,
      action: "UPDATE",
      tableName: "inventory",
      recordId: productId,
      newValues: {
        adjustmentType: adjustmentType === "increase" ? "increase" : "decrease",
        quantity,
        newStock,
        ...(reason ? { reason } : {}),
      },
      ...auditRequestMetadata(request),
    });

    void invalidateInventoryCache(pharmacyId);

    return NextResponse.json({ success: true, newStock });
  } catch (error) {
    console.error("POST /api/inventory/adjustment", error);
    const message = error instanceof Error ? error.message : "Adjustment failed";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

async function invalidateInventoryCache(pharmacyId: string) {
  await Promise.all([
    cacheDelByPrefix(`inventory:${pharmacyId}`),
    cacheDelByPrefix(`dashboard:${pharmacyId}`),
    cacheDelByPrefix(`reports:${pharmacyId}`),
  ]);
}
