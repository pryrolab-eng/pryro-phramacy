import { NextResponse } from "next/server";

import { getAuthUser } from "@/lib/auth/get-auth-user";

import { resolveActivePharmacyContext } from "@/lib/pharmacy/active-pharmacy";

import { getStaffAllowedBranchIds } from "@/lib/pharmacy/staff-branch-access";

import { loadRolePermissions } from "@/lib/rbac/permissions";

import { userMustChangePassword } from "@/lib/auth/must-change-password";

import { storeGetPublicUserProfile } from "@/lib/db/public-users-store";



export const dynamic = "force-dynamic";



export async function GET() {

  try {

    const user = await getAuthUser();

    if (!user) {

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    }



    const ctx = await resolveActivePharmacyContext(user.id);

    const profile = await storeGetPublicUserProfile(user.id);



    let allowedBranchIds: string[] | null = null;

    let permissions: string[] = [];

    if (ctx.activePharmacyId) {

      allowedBranchIds = await getStaffAllowedBranchIds(

        user.id,

        ctx.activePharmacyId,

        ctx.role,

      );

      permissions = await loadRolePermissions(ctx.role);

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

      mustChangePassword: userMustChangePassword({

        user_metadata: user.user_metadata ?? {},

      }),

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

