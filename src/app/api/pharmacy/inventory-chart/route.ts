import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { storeGetInventoryChart } from "@/lib/db/reports-store";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json([]);
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const chartData = await storeGetInventoryChart(pharmacyId);

    return NextResponse.json(chartData);
  } catch (error) {
    console.error("GET /api/pharmacy/inventory-chart", error);
    return NextResponse.json([]);
  }
}
