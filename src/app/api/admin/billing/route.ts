import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "../../../../../supabase/server";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";
import { buildAdminBillingPayload } from "@/lib/admin/billing-enrichment";

/** GET /api/admin/billing — payments, pharmacy billing rows, reconciliation. */
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
    const payload = await buildAdminBillingPayload(db);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("GET /api/admin/billing", error);
    return NextResponse.json(
      { error: "Failed to fetch billing data" },
      { status: 500 },
    );
  }
}
