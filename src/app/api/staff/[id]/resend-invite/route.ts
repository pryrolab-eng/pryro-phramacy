import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { sendStaffInviteEmail } from "@/lib/email/staff-invite";
import { prisma } from "@/lib/db/prisma";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  entitlementErrorResponse,
  requirePharmacyEntitlement,
} from "@/lib/subscription/assert-entitlement";
import { generateTemporaryPassword } from "@/lib/staff/temporary-password";
import { buildStaffInviteApiPayload } from "@/lib/staff/staff-invite-response";
import {
  permissionErrorResponse,
  requirePharmacyPermission,
} from "@/lib/rbac/require-pharmacy-permission";
import { PHARMACY_PERMISSIONS } from "@/lib/rbac/permissions";
import { MUST_CHANGE_PASSWORD_METADATA_KEY } from "@/lib/auth/must-change-password";
import {
  adminGetAuthUserById,
  adminUpdateAuthUserMetadata,
  adminUpdateAuthUserPassword,
} from "@/lib/auth/admin-users";
import { findPharmacyUserByIdFromDb } from "@/lib/db/staff";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: pharmacyUserId } = await params;
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    await requirePharmacyPermission(user.id, PHARMACY_PERMISSIONS.staffManage);
    const pharmacyId = await requireSessionPharmacyId(user.id);

    await requirePharmacyEntitlement({
      pharmacyId,
      feature: "staff.invite",
    });

    const member = await findPharmacyUserByIdFromDb(pharmacyUserId);
    if (!member || member.pharmacy_id !== pharmacyId || !member.user_id) {
      return NextResponse.json(
        { success: false, error: "Staff member not found" },
        { status: 404 },
      );
    }

    const memberUserId = member.user_id;
    const authAccount = await adminGetAuthUserById(memberUserId);
    if (!authAccount?.email) {
      return NextResponse.json(
        { success: false, error: "Could not load staff account" },
        { status: 500 },
      );
    }

    const email = authAccount.email.trim().toLowerCase();
    const fullName =
      String(authAccount.user_metadata?.full_name ?? "").trim() ||
      email.split("@")[0]?.replace(/[._]/g, " ") ||
      "Team member";
    const role = String(member.role ?? "pharmacist").trim() || "pharmacist";

    const pharmacy = await prisma.pharmacies.findUnique({
      where: { id: pharmacyId },
      select: { name: true },
    });

    const pharmacyName = String(pharmacy?.name ?? "").trim() || "your pharmacy";
    const password = generateTemporaryPassword();

    try {
      await adminUpdateAuthUserPassword(memberUserId, password);
      await adminUpdateAuthUserMetadata(memberUserId, {
        [MUST_CHANGE_PASSWORD_METADATA_KEY]: true,
      });
    } catch (passwordError) {
      return NextResponse.json(
        { success: false, error: "Failed to reset password" },
        { status: 500 },
      );
    }

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
        userId: memberUserId,
        messageWhenEmailOk: "Login instructions were sent by email",
        messageWhenEmailFailed:
          "Password was reset; invitation email could not be sent",
      }),
    );
  } catch (error) {
    const forbidden = permissionErrorResponse(error);
    if (forbidden) {
      return NextResponse.json(forbidden.body, { status: forbidden.status });
    }
    const mapped = entitlementErrorResponse(error);
    if (mapped) {
      return NextResponse.json(mapped.body, { status: mapped.status });
    }
    console.error("Resend staff invite error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to resend login instructions",
      },
      { status: 500 },
    );
  }
}
