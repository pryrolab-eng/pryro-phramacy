import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  permissionErrorResponse,
  requirePharmacyPermission,
} from "@/lib/rbac/require-pharmacy-permission";
import { PHARMACY_PERMISSIONS } from "@/lib/rbac/permissions";
import {
  adminUpdateAuthUserMetadata,
  adminUpdateAuthUserPassword,
} from "@/lib/auth/admin-users";
import { MUST_CHANGE_PASSWORD_METADATA_KEY } from "@/lib/auth/must-change-password";
import {
  storeDeletePharmacyUser,
  storeFindPharmacyUser,
  storeUpdateStaffMember,
} from "@/lib/db/staff-store";
import { auditRequestMetadata, writeAuditLog } from "@/lib/db/audit-logs";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: pharmacyUserId } = await params;
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await requirePharmacyPermission(user.id, PHARMACY_PERMISSIONS.staffManage);
    const pharmacyId = await requireSessionPharmacyId(user.id);
    const body = await request.json();

    const member = await storeFindPharmacyUser(pharmacyUserId);
    if (!member || member.pharmacy_id !== pharmacyId) {
      return NextResponse.json(
        { success: false, error: "Staff member not found" },
        { status: 404 },
      );
    }

    const authUserId = member.user_id;
    if (!authUserId) {
      return NextResponse.json(
        { success: false, error: "Staff account is not linked to a user" },
        { status: 400 },
      );
    }

    await storeUpdateStaffMember({
      pharmacyUserId,
      authUserId,
      name: body.name,
      phone: body.phone,
      role: body.role,
      isActive:
        body.status !== undefined ? body.status !== "inactive" : undefined,
    });

    if (body.password && String(body.password).trim()) {
      try {
        await adminUpdateAuthUserPassword(authUserId, body.password);
        await adminUpdateAuthUserMetadata(authUserId, {
          [MUST_CHANGE_PASSWORD_METADATA_KEY]: true,
        });
      } catch (passwordError) {
        console.error("Password update error:", passwordError);
        return NextResponse.json({
          success: false,
          error: "Failed to update password",
        });
      }
    }

    await writeAuditLog({
      pharmacyId,
      userId: user.id,
      action: "UPDATE",
      tableName: "pharmacy_users",
      recordId: pharmacyUserId,
      oldValues: {
        role: member.role,
        is_active: member.is_active,
        user_id: member.user_id,
      },
      newValues: {
        name: body.name,
        phone: body.phone,
        role: body.role,
        isActive:
          body.status !== undefined ? body.status !== "inactive" : undefined,
        passwordChanged: Boolean(body.password && String(body.password).trim()),
      },
      ...auditRequestMetadata(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const forbidden = permissionErrorResponse(error);
    if (forbidden) {
      return NextResponse.json(forbidden.body, { status: forbidden.status });
    }
    console.error("Error updating staff:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to update staff member",
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: pharmacyUserId } = await params;
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await requirePharmacyPermission(user.id, PHARMACY_PERMISSIONS.staffManage);
    const pharmacyId = await requireSessionPharmacyId(user.id);

    const member = await storeFindPharmacyUser(pharmacyUserId);
    if (!member || member.pharmacy_id !== pharmacyId) {
      return NextResponse.json(
        { success: false, error: "Staff member not found" },
        { status: 404 },
      );
    }

    await storeDeletePharmacyUser(pharmacyUserId);
    await writeAuditLog({
      pharmacyId,
      userId: user.id,
      action: "DELETE",
      tableName: "pharmacy_users",
      recordId: pharmacyUserId,
      oldValues: {
        role: member.role,
        is_active: member.is_active,
        user_id: member.user_id,
      },
      ...auditRequestMetadata(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const forbidden = permissionErrorResponse(error);
    if (forbidden) {
      return NextResponse.json(forbidden.body, { status: forbidden.status });
    }
    console.error("Error deleting staff:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to delete staff member",
    });
  }
}
