import { NextRequest } from "next/server";
import { createRouteHandlerClient } from "../../../../../supabase/route-handler";
import { createServiceClient } from "../../../../../supabase/service";
import { scheduleSubscriptionDowngrade } from "@/lib/subscription/schedule-downgrade";

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

    const result = await scheduleSubscriptionDowngrade(
      admin,
      userPharmacy.pharmacy_id,
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
