import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { scheduleSubscriptionDowngrade } from "@/lib/subscription/schedule-downgrade";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { auditRequestMetadata, writeAuditLog } from "@/lib/db/audit-logs";

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const targetPlanId =
      body.target_plan_id ?? body.targetPlanId ?? body.planId;

    if (!targetPlanId || typeof targetPlanId !== "string") {
      return NextResponse.json(
        { error: "target_plan_id is required" },
        { status: 400 },
      );
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const result = await scheduleSubscriptionDowngrade(pharmacyId, targetPlanId);
    await writeAuditLog({
      pharmacyId,
      userId: user.id,
      action: "UPDATE",
      tableName: "subscriptions",
      recordId: result.subscriptionId,
      newValues: {
        changeType: "downgrade_scheduled",
        targetPlanId,
        effectiveAt: result.effectiveAt,
        replaced: result.replaced,
      },
      ...auditRequestMetadata(request),
    });

    return NextResponse.json({
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
