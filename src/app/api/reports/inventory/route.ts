import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  entitlementRouteResponse,
  guardReportsAccessForUser,
} from "@/lib/subscription/route-guards";
import { storeGetInventoryReport } from "@/lib/db/reports-store";

export async function GET() {
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
    const report = await storeGetInventoryReport(pharmacyId);
    return NextResponse.json(report);
  } catch (error) {
    console.error("GET /api/reports/inventory", error);
    return NextResponse.json({ inventoryAlerts: [] });
  }
}
