import { NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import { buildAdminReportsSummary } from "@/lib/admin/reports-summary";

export async function GET() {
  try {
    const auth = await requirePlatformAdminApi();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const payload = await buildAdminReportsSummary();
    return NextResponse.json(payload);
  } catch (e) {
    console.error("GET /api/admin/reports/summary:", e);
    return NextResponse.json(
      { error: "Failed to load reports summary" },
      { status: 500 },
    );
  }
}
