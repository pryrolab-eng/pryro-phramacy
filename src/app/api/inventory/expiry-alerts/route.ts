import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { storeListExpiryAlerts } from "@/lib/db/inventory-store";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const withinDays = Number(
      new URL(request.url).searchParams.get("withinDays") ?? "60",
    );
    const days =
      Number.isFinite(withinDays) && withinDays > 0
        ? Math.min(Math.floor(withinDays), 365)
        : 60;

    const expiryAlerts = await storeListExpiryAlerts(pharmacyId, days);
    return NextResponse.json(expiryAlerts);
  } catch (error) {
    console.error("GET /api/inventory/expiry-alerts", error);
    return NextResponse.json(
      { error: "Failed to fetch expiry alerts" },
      { status: 500 },
    );
  }
}
