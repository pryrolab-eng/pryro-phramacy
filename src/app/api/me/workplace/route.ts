import { NextResponse } from "next/server";

import { getAuthUser } from "@/lib/auth/get-auth-user";

import { prisma } from "@/lib/db/prisma";

import { resolveActivePharmacyContext } from "@/lib/pharmacy/active-pharmacy";

import { getStaffAllowedBranchIds } from "@/lib/pharmacy/staff-branch-access";

import { formatPharmacyRoleLabel } from "@/lib/rbac/pharmacy-roles";



export const dynamic = "force-dynamic";



/** Read-only workplace context for team members (staff settings + dashboard). */

export async function GET() {

  try {

    const user = await getAuthUser();



    if (!user) {

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    }



    const ctx = await resolveActivePharmacyContext(user.id);



    if (!ctx.activePharmacyId) {

      return NextResponse.json({ error: "No active pharmacy" }, { status: 404 });

    }



    const pharmacy = await prisma.pharmacies.findUnique({

      where: { id: ctx.activePharmacyId },

      select: {

        id: true,

        name: true,

        license_number: true,

        city: true,

        province: true,

        phone: true,

        email: true,

      },

    });



    const allowedBranchIds = await getStaffAllowedBranchIds(

      user.id,

      ctx.activePharmacyId,

      ctx.role,

    );



    const branchList = await prisma.branches.findMany({

      where: { pharmacy_id: ctx.activePharmacyId, is_active: true },

      select: { id: true, name: true, address: true, created_at: true },

      orderBy: { created_at: "asc" },

    });



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

