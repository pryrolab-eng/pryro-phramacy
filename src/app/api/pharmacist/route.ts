import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
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

export async function POST(request: Request) {
  try {
    const sessionUser = await getAuthUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await requirePharmacyPermission(
      sessionUser.id,
      PHARMACY_PERMISSIONS.staffManage,
    );

    const body = await request.json();

    if (!body.pharmacy_id) {
      return NextResponse.json({ error: "pharmacy_id is required" }, { status: 400 });
    }

    await requirePharmacyEntitlement({
      pharmacyId: body.pharmacy_id,
      feature: "staff.invite",
      limit: "users",
    });

    const email = String(body.email ?? "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    const result = await invitePharmacyStaffMember({
      pharmacyId: body.pharmacy_id,
      pharmacyName: String(body.pharmacy_name ?? "").trim(),
      email,
      fullName: String(body.full_name ?? "").trim(),
      phone: body.phone,
      role: body.role,
      password: body.password,
      invitedByUserId: sessionUser.id,
      request,
    });

    return NextResponse.json(result);
  } catch (error) {
    const forbidden = permissionErrorResponse(error);
    if (forbidden) {
      return NextResponse.json(forbidden.body, { status: forbidden.status });
    }
    if (error instanceof StaffInviteEmailRejectedError) {
      return NextResponse.json(
        {
          success: false,
          code: STAFF_INVITE_EMAIL_REJECTED_CODE,
          error: STAFF_INVITE_EMAIL_REJECTED_MESSAGE,
        },
        { status: 409 },
      );
    }
    const mapped = entitlementErrorResponse(error);
    if (mapped) {
      return NextResponse.json(mapped.body, { status: mapped.status });
    }
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create pharmacist",
      },
      { status: 500 },
    );
  }
}
