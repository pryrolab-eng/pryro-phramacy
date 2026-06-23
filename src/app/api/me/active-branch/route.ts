import { NextRequest, NextResponse } from "next/server";

import { getAuthUser } from "@/lib/auth/get-auth-user";

import { setActiveBranchId } from "@/lib/pharmacy/active-pharmacy";



export const dynamic = "force-dynamic";



export async function POST(request: NextRequest) {

  try {

    const user = await getAuthUser();

    if (!user) {

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    }



    const body = (await request.json()) as { branchId?: string };

    if (!body.branchId) {

      return NextResponse.json({ error: "branchId is required" }, { status: 400 });

    }



    const ctx = await setActiveBranchId(user.id, body.branchId);



    return NextResponse.json({

      success: true,

      activePharmacyId: ctx.activePharmacyId,

      activeBranchId: ctx.activeBranchId,

      role: ctx.role,

    });

  } catch (error) {

    const message =

      error instanceof Error ? error.message : "Failed to switch branch";

    const status =

      message.includes("Invalid") || message.includes("access") ? 403 : 500;

    console.error("POST /api/me/active-branch", error);

    return NextResponse.json({ error: message }, { status });

  }

}

