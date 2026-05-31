import { NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";
import { createServiceClient } from "../../../../../supabase/service";
import { resolveActivePharmacyContext } from "@/lib/pharmacy/active-pharmacy";
import { getStaffAllowedBranchIds } from "@/lib/pharmacy/staff-branch-access";
import { formatPharmacyRoleLabel } from "@/lib/rbac/pharmacy-roles";

export const dynamic = "force-dynamic";

/** Read-only workplace context for team members (staff settings + dashboard). */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createServiceClient();
    const ctx = await resolveActivePharmacyContext(admin, user.id);

    if (!ctx.activePharmacyId) {
      return NextResponse.json({ error: "No active pharmacy" }, { status: 404 });
    }

    const { data: pharmacy } = await admin
      .from("pharmacies")
      .select("id, name, license_number, city, province, phone, email")
      .eq("id", ctx.activePharmacyId)
      .maybeSingle();

    const allowedBranchIds = await getStaffAllowedBranchIds(
      admin,
      user.id,
      ctx.activePharmacyId,
      ctx.role,
    );

    const { data: branches } = await admin
      .from("branches")
      .select("id, name, address, created_at")
      .eq("pharmacy_id", ctx.activePharmacyId)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    const branchList = branches ?? [];
    const mainBranchId = branchList[0]?.id ?? null;
    const visibleBranches =
      allowedBranchIds === null
        ? branchList
        : branchList.filter((b) => allowedBranchIds.includes(b.id));

    const activeBranch = branchList.find((b) => b.id === ctx.activeBranchId);

    return NextResponse.json({
      pharmacy: pharmacy
        ? {
            id: pharmacy.id,
            name: pharmacy.name,
            licenseNumber: pharmacy.license_number,
            location: [pharmacy.city, pharmacy.province]
              .filter(Boolean)
              .join(", "),
            phone: pharmacy.phone,
            businessEmail: pharmacy.email,
          }
        : null,
      membership: {
        role: ctx.role,
        roleLabel: formatPharmacyRoleLabel(ctx.role),
      },
      branchAccess: {
        unrestricted: allowedBranchIds === null,
        allowedBranchIds,
        branches: visibleBranches.map((b) => ({
          id: b.id,
          name: b.name,
          city: b.address,
          isMain: b.id === mainBranchId,
        })),
        activeBranch: activeBranch
          ? {
              id: activeBranch.id,
              name: activeBranch.name,
              isMain: activeBranch.id === mainBranchId,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("GET /api/me/workplace", error);
    return NextResponse.json(
      { error: "Failed to load workplace" },
      { status: 500 },
    );
  }
}
