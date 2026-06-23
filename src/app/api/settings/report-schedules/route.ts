import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  listReportSchedules,
  upsertReportSchedule,
} from "@/lib/db/future-feature-settings";

const ALLOWED_FREQUENCIES = new Set(["off", "daily", "weekly", "monthly"]);

function normalizeRecipients(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => String(entry).trim())
    .filter((entry) => entry.includes("@"))
    .slice(0, 10);
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const pharmacyId = await requireSessionPharmacyId(user.id);
    const schedules = await listReportSchedules(pharmacyId);
    return NextResponse.json({
      schedules: schedules.map((row) => ({
        id: row.id,
        reportType: row.report_type,
        frequency: row.frequency,
        recipients: Array.isArray(row.recipients) ? row.recipients : [],
        isActive: row.is_active,
      })),
    });
  } catch (error) {
    console.error("GET /api/settings/report-schedules", error);
    return NextResponse.json(
      { error: "Failed to load report schedules" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const pharmacyId = await requireSessionPharmacyId(user.id);
    const body = (await request.json()) as Record<string, unknown>;
    const reportType = String(body.reportType ?? "sales").trim() || "sales";
    const frequency = String(body.frequency ?? "off").trim();
    if (!ALLOWED_FREQUENCIES.has(frequency)) {
      return NextResponse.json({ error: "Invalid frequency" }, { status: 400 });
    }

    const schedule = await upsertReportSchedule({
      pharmacyId,
      reportType,
      frequency,
      recipients: normalizeRecipients(body.recipients),
      isActive: frequency !== "off" && body.isActive !== false,
    });

    return NextResponse.json({
      success: true,
      schedule: {
        id: schedule.id,
        reportType: schedule.report_type,
        frequency: schedule.frequency,
        recipients: Array.isArray(schedule.recipients) ? schedule.recipients : [],
        isActive: schedule.is_active,
      },
    });
  } catch (error) {
    console.error("PUT /api/settings/report-schedules", error);
    return NextResponse.json(
      { error: "Failed to save report schedule" },
      { status: 500 },
    );
  }
}
