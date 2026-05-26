import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "../../../../../supabase/server";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";
import { buildAdminReportsSummary } from "@/lib/admin/reports-summary";

/** GET /api/admin/reports-summary — platform metrics for admin dashboard & reports. */
export async function GET() {
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
      return NextResponse.json(
        { error: "Forbidden: platform admin access required" },
        { status: 403 },
      );
    }

    const db = createServiceClient();
    const payload = await buildAdminReportsSummary(db);
    return NextResponse.json(payload);
  } catch (e) {
    console.error("GET /api/admin/reports-summary:", e);
    return NextResponse.json(
      { error: "Failed to load reports summary" },
      { status: 500 },
    );
  }
}
