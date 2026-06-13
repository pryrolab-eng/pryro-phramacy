import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { cancelScheduledSubscriptionChange } from "@/lib/subscription/cancel-scheduled-change";
import { getScheduledSubscriptionChange } from "@/lib/subscription/get-scheduled-change";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const scheduled = await getScheduledSubscriptionChange(pharmacyId);

    return NextResponse.json({
      scheduledChange: scheduled
        ? {
            status: scheduled.status,
            effectiveAt: scheduled.effectiveAt,
            changeType: scheduled.changeType,
            currentPlan: scheduled.currentPlan,
            targetPlan: scheduled.targetPlan,
            subscriptionId: scheduled.subscriptionId,
          }
        : null,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch scheduled change";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const { canceled } = await cancelScheduledSubscriptionChange(pharmacyId);

    if (!canceled) {
      return NextResponse.json(
        { error: "No scheduled change to cancel" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, canceled: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to cancel scheduled change";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
