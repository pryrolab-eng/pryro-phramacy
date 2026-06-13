import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { storeStockAlerts } from "@/lib/db/inventory-store";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ all: [], lowStock: [], expiring: [] });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const alerts = await storeStockAlerts(pharmacyId);

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("GET /api/stock-alerts", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch stock alerts";
    const status = message === "Pharmacy not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
