import { NextRequest } from "next/server";
import { createRouteHandlerClient } from "../../../../../supabase/route-handler";
import { createServiceClient } from "../../../../../supabase/service";
import { scheduleSubscriptionDowngrade } from "@/lib/subscription/schedule-downgrade";
import { resolveActivePharmacyId } from "@/lib/pharmacy/active-pharmacy";

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
    const targetPlanId = body.target_plan_id ?? body.targetPlanId ?? body.planId;

    if (!targetPlanId || typeof targetPlanId !== "string") {
      return json({ error: "target_plan_id is required" }, { status: 400 });
    }

    const admin = createServiceClient();

    const pharmacyId = await resolveActivePharmacyId(admin, user.id);
    if (!pharmacyId) {
      return json({ error: "Pharmacy not found" }, { status: 403 });
    }

    const result = await scheduleSubscriptionDowngrade(
      admin,
      pharmacyId,
      targetPlanId
    );

    return json({
      success: true,
      effectiveAt: result.effectiveAt,
      replaced: result.replaced,
      currentPlan: result.currentPlan,
      scheduledPlan: result.scheduledPlan,
      subscriptionId: result.subscriptionId,
    });
  } catch (error: unknown) {
    console.error("schedule-downgrade error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to schedule downgrade";
    return json({ error: message }, { status: 400 });
  }
}
