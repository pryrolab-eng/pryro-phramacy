import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  permissionErrorResponse,
  requirePharmacyPermission,
} from "@/lib/rbac/require-pharmacy-permission";
import { PHARMACY_PERMISSIONS } from "@/lib/rbac/permissions";
import { storeListPharmacyStaff } from "@/lib/db/staff-store";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requirePharmacyPermission(user.id, PHARMACY_PERMISSIONS.staffManage);

    const pharmacyId = await requireUserPharmacyId(user.id);
    const formattedStaff = await storeListPharmacyStaff(pharmacyId);

    return NextResponse.json(formattedStaff);
  } catch (error) {
    const forbidden = permissionErrorResponse(error);
    if (forbidden) {
      return NextResponse.json(forbidden.body, { status: forbidden.status });
    }
    console.error("GET /api/staff", error);
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { success: false, error: "Use /api/pharmacist to create staff" },
    { status: 400 },
  );
}
