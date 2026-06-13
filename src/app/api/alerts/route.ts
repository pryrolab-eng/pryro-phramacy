import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { storeListDashboardAlerts } from "@/lib/db/alerts-store";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const alerts = await storeListDashboardAlerts(pharmacyId);

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("GET /api/alerts", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch alerts";
    const status = message === "Pharmacy not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
