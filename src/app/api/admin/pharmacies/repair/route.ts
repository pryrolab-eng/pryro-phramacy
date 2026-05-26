import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "../../../../../../supabase/server";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";
import { repairPharmacySubscriptionData } from "@/lib/admin/repair-pharmacy-subscription-data";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = await resolveIsAppPlatformAdmin(supabase, user.id, null);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createServiceClient();
    const result = await repairPharmacySubscriptionData(admin);

    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    console.error("POST /api/admin/pharmacies/repair", e);
    return NextResponse.json(
      { success: false, error: "Repair failed" },
      { status: 500 },
    );
  }
}
