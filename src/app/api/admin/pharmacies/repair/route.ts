import { NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import { repairPharmacySubscriptionData } from "@/lib/admin/repair-pharmacy-subscription-data";

export async function POST() {
  try {
    const auth = await requirePlatformAdminApi();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const result = await repairPharmacySubscriptionData();

    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    console.error("POST /api/admin/pharmacies/repair", e);
    return NextResponse.json(
      { success: false, error: "Repair failed" },
      { status: 500 },
    );
  }
}
