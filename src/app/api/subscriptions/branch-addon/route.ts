import { NextRequest } from "next/server";
import { createRouteHandlerClient } from "../../../../../supabase/route-handler";
import { createServiceClient } from "../../../../../supabase/service";
import {
  createSubscriptionOrchestrator,
  SubscriptionPlanChangeError,
} from "@/lib/subscription/orchestrator";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const { supabase, json } = createRouteHandlerClient(request);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const planId = body.planId ?? body.plan_id;
    const branchId = body.branchId ?? body.branch_id;
    const branch = body.branch as
      | { name?: string; address?: string; phone?: string; email?: string }
      | undefined;

    if (!planId || typeof planId !== "string") {
      return json({ error: "planId is required" }, { status: 400 });
    }

    if (!branchId && !branch?.name) {
      return json(
        {
          error:
            "Provide branchId for an existing branch, or branch.name to create a new branch with this add-on.",
        },
        { status: 400 }
      );
    }

    const admin = createServiceClient();

    const { data: userPharmacy, error: pharmacyError } = await admin
      .from("pharmacy_users")
      .select("pharmacy_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (pharmacyError || !userPharmacy?.pharmacy_id) {
      return json({ error: "Pharmacy not found" }, { status: 403 });
    }

    let planQuery = admin
      .from("subscription_plans")
      .select("id, name, price, plan_type, is_active")
      .eq("is_active", true)
      .eq("plan_type", "branch_addon");

    if (UUID_RE.test(planId)) {
      planQuery = planQuery.eq("id", planId);
    } else {
      planQuery = planQuery.ilike("name", planId);
    }

    const { data: plan, error: planError } = await planQuery.maybeSingle();

    if (planError || !plan) {
      return json(
        { error: "Branch add-on plan not found or is not available" },
        { status: 404 }
      );
    }

    const orch = createSubscriptionOrchestrator(admin);
    const result = await orch.beginPaidBranchAddon(
      userPharmacy.pharmacy_id,
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
      }
    );

    return json({
      success: true,
      requiresPayment: true,
      subscription: {
        id: result.subscriptionId,
        planId: result.planId,
        planName: result.planName,
        amount: result.amount,
        branchId: result.branchId,
        branchName: result.branchName,
        status: result.status,
      },
    });
  } catch (error: unknown) {
    if (error instanceof SubscriptionPlanChangeError) {
      return json({ error: error.message, code: error.code }, { status: 400 });
    }
    const message =
      error instanceof Error ? error.message : "Branch add-on checkout failed";
    return json({ error: message }, { status: 400 });
  }
}
