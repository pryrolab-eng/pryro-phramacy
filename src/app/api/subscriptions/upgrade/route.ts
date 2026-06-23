import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import {
  createSubscriptionOrchestrator,
  SubscriptionPlanChangeError,
} from "@/lib/subscription/orchestrator";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { storeResolveCatalogPlan } from "@/lib/db/subscriptions-store";
import { storeLinkPaymentTransactionToSubscription } from "@/lib/db/payment-transactions-store";
import { auditRequestMetadata, writeAuditLog } from "@/lib/db/audit-logs";

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { planId, paymentTransactionId } = body;

    if (!planId || typeof planId !== "string") {
      return NextResponse.json({ error: "Plan is required" }, { status: 400 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);

    let plan;
    try {
      plan = await storeResolveCatalogPlan(planId);
    } catch {
      return NextResponse.json(
        { error: `Plan "${planId}" not found or is not available` },
        { status: 404 },
      );
    }

    const orch = createSubscriptionOrchestrator();
    const change = await orch.requestPlanChange(pharmacyId, plan.id);

    const subscriptionId = change.subscriptionId;
    const requiresPayment =
      "requiresPayment" in change && change.requiresPayment === true;

    if (paymentTransactionId) {
      await storeLinkPaymentTransactionToSubscription({
        transactionId: String(paymentTransactionId),
        subscriptionId,
      });
    }

    await writeAuditLog({
      pharmacyId,
      userId: user.id,
      action: "UPDATE",
      tableName: "subscriptions",
      recordId: subscriptionId,
      newValues: {
        changeType: requiresPayment ? "paid_plan_change_requested" : "plan_changed",
        planId: plan.id,
        planName: plan.name,
        requiresPayment,
        paymentTransactionId: paymentTransactionId
          ? String(paymentTransactionId)
          : null,
      },
      ...auditRequestMetadata(request),
    });

    if (requiresPayment) {
      const pending = change as {
        subscriptionId: string;
        planId: string;
        planName: string;
        amount: number;
        status: string;
      };
      return NextResponse.json({
        success: true,
        subscription: {
          id: pending.subscriptionId,
          planId: pending.planId,
          planName: pending.planName,
          amount: pending.amount,
          requiresPayment: true,
          isActive: false,
          expiresAt: null,
          status: pending.status,
        },
      });
    }

    const active = change as {
      subscriptionId: string;
      planId: string;
      planName: string;
      expiresAt: string;
      status: string;
    };
    return NextResponse.json({
      success: true,
      subscription: {
        id: active.subscriptionId,
        planId: active.planId,
        planName: active.planName,
        amount: 0,
        requiresPayment: false,
        isActive: true,
        expiresAt: active.expiresAt,
        status: active.status,
      },
    });
  } catch (error: unknown) {
    console.error("Upgrade route error:", error);
    if (error instanceof SubscriptionPlanChangeError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          scheduleDowngradeUrl: "/api/subscriptions/schedule-downgrade",
        },
        { status: 400 },
      );
    }
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
