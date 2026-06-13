import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  getPharmacySecuritySetting,
  upsertPharmacySecuritySettingFromDb,
} from "@/lib/db/ip-whitelist";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { enabled } = await request.json();
    const pharmacyId = await requireSessionPharmacyId(user.id);

    const existing = (await getPharmacySecuritySetting(pharmacyId)) ?? {};
    await upsertPharmacySecuritySettingFromDb(pharmacyId, {
      ...existing,
      sso_enabled: Boolean(enabled),
    });

    return NextResponse.json({ success: true, enabled });
  } catch (error) {
    console.error("SSO toggle error:", error);
    return NextResponse.json({ error: "Failed to toggle SSO" }, { status: 500 });
  }
}
