import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  permissionErrorResponse,
  requirePharmacyPermission,
} from "@/lib/rbac/require-pharmacy-permission";
import { PHARMACY_PERMISSIONS } from "@/lib/rbac/permissions";
import {
  countPharmacyBranchesByIds,
  findPharmacyUserByIdFromDb,
  getStaffBranchIdsFromDb,
  setStaffBranchAssignmentsFromDb,
} from "@/lib/db/staff";

/** GET/PUT branch access for a pharmacy_users row (staff member). */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: pharmacyUserId } = await params;
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireSessionPharmacyId(user.id);
    const member = await findPharmacyUserByIdFromDb(pharmacyUserId);

    if (!member || member.pharmacy_id !== pharmacyId) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    const branchIds = await getStaffBranchIdsFromDb(pharmacyUserId);

    return NextResponse.json({
      pharmacyUserId,
      branchIds,
      unrestricted: branchIds.length === 0,
    });
  } catch (error) {
    console.error("GET staff branches", error);
    return NextResponse.json({ error: "Failed to load branch access" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: pharmacyUserId } = await params;
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requirePharmacyPermission(user.id, PHARMACY_PERMISSIONS.staffManage);
    const pharmacyId = await requireSessionPharmacyId(user.id);
    const member = await findPharmacyUserByIdFromDb(pharmacyUserId);

    if (!member || member.pharmacy_id !== pharmacyId) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    const body = await request.json();
    const branchIds = Array.isArray(body.branchIds)
      ? (body.branchIds as string[]).filter((id) => typeof id === "string")
      : [];

    if (branchIds.length > 0) {
      const validCount = await countPharmacyBranchesByIds({
        pharmacyId,
        branchIds,
      });
      if (validCount !== branchIds.length) {
        return NextResponse.json({ error: "Invalid branch id" }, { status: 400 });
      }
    }

    await setStaffBranchAssignmentsFromDb({ pharmacyUserId, branchIds });

    return NextResponse.json({
      success: true,
      branchIds,
      unrestricted: branchIds.length === 0,
    });
  } catch (error) {
    const forbidden = permissionErrorResponse(error);
    if (forbidden) {
      return NextResponse.json(forbidden.body, { status: forbidden.status });
    }
    console.error("PUT staff branches", error);
    return NextResponse.json({ error: "Failed to update branch access" }, { status: 500 });
  }
}
