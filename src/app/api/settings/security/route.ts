import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  storeGetPharmacyIpWhitelistEnabled,
  storeUpsertPharmacySecuritySetting,
} from "@/lib/db/ip-whitelist-store";
import { getPharmacySecuritySetting } from "@/lib/db/ip-whitelist";
import { writeAuditLog } from "@/lib/db/audit-logs";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireSessionPharmacyId(user.id);
    const settings = await getPharmacySecuritySetting(pharmacyId);

    return NextResponse.json(
      settings ?? { ip_whitelist_enabled: await storeGetPharmacyIpWhitelistEnabled(pharmacyId) },
    );
  } catch (error) {
    console.error("Security settings fetch error:", error);
    return NextResponse.json({ ip_whitelist_enabled: false });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const pharmacyId = await requireSessionPharmacyId(user.id);

    await storeUpsertPharmacySecuritySetting(pharmacyId, body);
    await writeAuditLog({
      pharmacyId,
      userId: user.id,
      action: "UPDATE",
      tableName: "system_settings",
      newValues: body,
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Security settings update error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}
