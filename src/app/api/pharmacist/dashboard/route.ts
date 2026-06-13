import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { fetchPharmacistDashboardStatsFromDb } from "@/lib/db/pharmacist-dashboard";

const EMPTY_STATS = {
  prescriptionsToday: 0,
  customersServed: 0,
  averageWaitTime: 8,
  completedSales: 0,
  pendingPrescriptions: 0,
  consultationsGiven: 0,
  inventoryChecks: 0,
  alertsHandled: 0,
};

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const stats = await fetchPharmacistDashboardStatsFromDb(pharmacyId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("GET /api/pharmacist/dashboard", error);
    return NextResponse.json(EMPTY_STATS);
  }
}
