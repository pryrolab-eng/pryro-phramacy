import { NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import { buildAdminBillingPayload } from "@/lib/admin/billing-enrichment";

/** GET /api/admin/billing — payments, pharmacy billing rows, reconciliation. */
export async function GET() {
  try {
    const auth = await requirePlatformAdminApi();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const payload = await buildAdminBillingPayload();
    return NextResponse.json(payload);
  } catch (error) {
    console.error("GET /api/admin/billing", error);
    return NextResponse.json(
      { error: "Failed to fetch billing data" },
      { status: 500 },
    );
  }
}
