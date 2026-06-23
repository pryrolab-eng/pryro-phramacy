import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { sendStaffInviteEmail } from "@/lib/email/staff-invite";
import {
  entitlementErrorResponse,
  requirePharmacyEntitlement,
} from "@/lib/subscription/assert-entitlement";
import { generateTemporaryPassword } from "@/lib/staff/temporary-password";
import { buildStaffInviteApiPayload } from "@/lib/staff/staff-invite-response";
import {
  assertStaffInviteEmailAllowed,
  mapCreateUserErrorForStaffInvite,
  StaffInviteEmailRejectedError,
  STAFF_INVITE_EMAIL_REJECTED_CODE,
  STAFF_INVITE_EMAIL_REJECTED_MESSAGE,
} from "@/lib/staff/staff-invite-email";
import {
  permissionErrorResponse,
  requirePharmacyPermission,
} from "@/lib/rbac/require-pharmacy-permission";
import { PHARMACY_PERMISSIONS } from "@/lib/rbac/permissions";
import { staffInviteUserMetadata } from "@/lib/auth/must-change-password";
import { adminCreateAuthUser } from "@/lib/auth/admin-users";
import { storeCreatePharmacyMembership } from "@/lib/db/pharmacy-users-store";
import { auditRequestMetadata, writeAuditLog } from "@/lib/db/audit-logs";

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

    const password =
      typeof body.password === "string" && body.password.trim().length >= 6
        ? body.password.trim()
        : generateTemporaryPassword();

    const fullName =
      String(body.full_name ?? "").trim() ||
      email.split("@")[0]?.replace(/[._]/g, " ") ||
      "Team member";

    const pharmacyName =
      String(body.pharmacy_name ?? "").trim() || "your pharmacy";

    const role = String(body.role ?? "pharmacist").trim() || "pharmacist";

    await assertStaffInviteEmailAllowed(body.pharmacy_id, email);

    let authUser: { user: { id: string } };
    try {
      authUser = await adminCreateAuthUser({
        email,
        password,
        fullName,
        userMetadata: staffInviteUserMetadata({
          full_name: fullName,
          phone: body.phone,
        }),
      });
    } catch (createUserError) {
      mapCreateUserErrorForStaffInvite(createUserError as never);
    }

    if (!authUser?.user) {
      return NextResponse.json(
        { success: false, error: "Failed to create team member" },
        { status: 500 },
      );
    }

    await storeCreatePharmacyMembership({
      pharmacyId: body.pharmacy_id,
      userId: authUser.user.id,
      role,
    });

    await writeAuditLog({
      pharmacyId: body.pharmacy_id,
      userId: sessionUser.id,
      action: "INSERT",
      tableName: "pharmacy_users",
      recordId: authUser.user.id,
      newValues: {
        invitedUserId: authUser.user.id,
        email,
        fullName,
        role,
      },
      ...auditRequestMetadata(request),
    });

    const emailResult = await sendStaffInviteEmail({
      to: email,
      fullName,
      pharmacyName,
      role,
      temporaryPassword: password,
    });

    return NextResponse.json(
      buildStaffInviteApiPayload({
        email,
        temporaryPassword: password,
        emailResult,
        userId: authUser.user.id,
        messageWhenEmailOk: "Team member created and invitation email sent",
        messageWhenEmailFailed:
          "Team member created; invitation email could not be sent",
      }),
    );
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
