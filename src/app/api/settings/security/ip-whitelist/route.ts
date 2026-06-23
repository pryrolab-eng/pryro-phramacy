import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { storeUpsertPharmacySecuritySetting } from "@/lib/db/ip-whitelist-store";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { enabled } = await request.json();
    const pharmacyId = await requireSessionPharmacyId(user.id);

    await storeUpsertPharmacySecuritySetting(pharmacyId, {
      ip_whitelist_enabled: enabled,
    });

    return NextResponse.json({ success: true, enabled });
  } catch (error) {
    console.error("IP whitelist toggle error:", error);
    return NextResponse.json(
      { error: "Failed to toggle IP whitelist" },
      { status: 500 },
    );
  }
}
