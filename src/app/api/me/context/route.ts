import { NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";
import { createServiceClient } from "../../../../../supabase/service";
import { resolveActivePharmacyContext } from "@/lib/pharmacy/active-pharmacy";
import { getStaffAllowedBranchIds } from "@/lib/pharmacy/staff-branch-access";
import { loadRolePermissions } from "@/lib/rbac/permissions";
import { userMustChangePassword } from "@/lib/auth/must-change-password";

export const dynamic = "force-dynamic";

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

    const { data: profile } = await admin
      .from("users")
      .select("full_name, email, is_platform_admin")
      .eq("id", user.id)
      .maybeSingle();

    let allowedBranchIds: string[] | null = null;
    let permissions: string[] = [];
    if (ctx.activePharmacyId) {
      allowedBranchIds = await getStaffAllowedBranchIds(
        admin,
        user.id,
        ctx.activePharmacyId,
        ctx.role,
      );
      permissions = await loadRolePermissions(admin, ctx.role);
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email ?? profile?.email ?? null,
        fullName: profile?.full_name ?? null,
        isPlatformAdmin: profile?.is_platform_admin === true,
      },
      activePharmacyId: ctx.activePharmacyId,
      activeBranchId: ctx.activeBranchId,
      role: ctx.role,
      allowedBranchIds,
      permissions,
      mustChangePassword: userMustChangePassword(user),
      memberships: ctx.memberships.map((m) => ({
        pharmacyId: m.pharmacy_id,
        pharmacyName: m.pharmacy_name,
        role: m.role,
        isActive: m.pharmacy_id === ctx.activePharmacyId,
      })),
    });
  } catch (error) {
    console.error("GET /api/me/context", error);
    return NextResponse.json(
      { error: "Failed to load session context" },
      { status: 500 },
    );
  }
}
