import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import {
  createSubscriptionOrchestrator,
  SubscriptionPlanChangeError,
} from "@/lib/subscription/orchestrator";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { storeFindBranchAddonPlan } from "@/lib/db/subscriptions-store";

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const planId = body.planId ?? body.plan_id;
    const branchId = body.branchId ?? body.branch_id;
    const branch = body.branch as
      | { name?: string; address?: string; phone?: string; email?: string }
      | undefined;

    if (!planId || typeof planId !== "string") {
      return NextResponse.json({ error: "planId is required" }, { status: 400 });
    }

    if (!branchId && !branch?.name) {
      return NextResponse.json(
        {
          error:
            "Provide branchId for an existing branch, or branch.name to create a new branch with this add-on.",
        },
        { status: 400 },
      );
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const plan = await storeFindBranchAddonPlan(planId);

    if (!plan) {
      return NextResponse.json(
        { error: "Branch add-on plan not found or is not available" },
        { status: 404 },
      );
    }

    const orch = createSubscriptionOrchestrator();
    const result = await orch.beginPaidBranchAddon(
      pharmacyId,
      plan.id as string,
      {
        branchId: typeof branchId === "string" ? branchId : undefined,
        newBranch: branch?.name
          ? {
              name: branch.name,
              address: branch.address,
              phone: branch.phone,
              email: branch.email,
            }
          : undefined,
      },
    );

    return NextResponse.json({
      success: true,
      subscription: result,
    });
  } catch (error: unknown) {
    if (error instanceof SubscriptionPlanChangeError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 },
      );
    }
    console.error("branch-addon error:", error);
    const message =
      error instanceof Error ? error.message : "Branch add-on failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
