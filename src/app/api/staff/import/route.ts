import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  entitlementErrorResponse,
  requirePharmacyEntitlement,
} from "@/lib/subscription/assert-entitlement";
import {
  permissionErrorResponse,
  requirePharmacyPermission,
} from "@/lib/rbac/require-pharmacy-permission";
import { PHARMACY_PERMISSIONS } from "@/lib/rbac/permissions";
import {
  invitePharmacyStaffMember,
  StaffInviteEmailRejectedError,
} from "@/lib/staff/invite-pharmacy-staff";
import {
  STAFF_INVITE_EMAIL_REJECTED_CODE,
  STAFF_INVITE_EMAIL_REJECTED_MESSAGE,
} from "@/lib/staff/staff-invite-email";
import { MAX_IMPORT_ROWS } from "@/lib/import/types";

type ImportBody = {
  pharmacy_name?: string;
  rows?: Array<{
    fullName: string;
    email: string;
    phone: string;
    role?: string;
  }>;
};

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getAuthUser();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" });
    }

    await requirePharmacyPermission(
      sessionUser.id,
      PHARMACY_PERMISSIONS.staffManage,
    );

    const pharmacyId = await requireUserPharmacyId(sessionUser.id);
    const body = (await request.json()) as ImportBody;
    const rows = body.rows ?? [];

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "No rows to import" });
    }

    if (rows.length > MAX_IMPORT_ROWS) {
      return NextResponse.json({
        success: false,
        error: `Import limited to ${MAX_IMPORT_ROWS} rows per batch`,
      });
    }

    await requirePharmacyEntitlement({
      pharmacyId,
      feature: "staff.invite",
      limit: "users",
    });

    const failures: Array<{ rowNumber: number; label: string; error: string }> =
      [];
    let succeeded = 0;

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index]!;
      const label = row.fullName?.trim() || row.email?.trim() || "Unnamed staff";
      try {
        await invitePharmacyStaffMember({
          pharmacyId,
          pharmacyName: String(body.pharmacy_name ?? "").trim(),
          email: String(row.email ?? "").trim().toLowerCase(),
          fullName: String(row.fullName ?? "").trim(),
          phone: String(row.phone ?? "").trim(),
          role: String(row.role ?? "staff").trim(),
          invitedByUserId: sessionUser.id,
          request,
        });
        succeeded += 1;
      } catch (error) {
        if (error instanceof StaffInviteEmailRejectedError) {
          failures.push({
            rowNumber: index + 2,
            label,
            error: STAFF_INVITE_EMAIL_REJECTED_MESSAGE,
          });
          continue;
        }
        failures.push({
          rowNumber: index + 2,
          label,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: failures.length === 0,
      attempted: rows.length,
      succeeded,
      failures,
    });
  } catch (error) {
    const forbidden = permissionErrorResponse(error);
    if (forbidden) {
      return NextResponse.json(forbidden.body, { status: forbidden.status });
    }
    const mapped = entitlementErrorResponse(error);
    if (mapped) {
      return NextResponse.json(mapped.body, { status: mapped.status });
    }
    console.error("POST /api/staff/import", error);
    return NextResponse.json({
      success: false,
      error: "Failed to import staff",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
