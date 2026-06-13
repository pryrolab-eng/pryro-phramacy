import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { createSubscriptionUpgrade } from "@/lib/subscription/create-pending-upgrade";
import { getScheduledSubscriptionChange } from "@/lib/subscription/get-scheduled-change";
import { SubscriptionPlanChangeError } from "@/lib/subscription/orchestrator";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  storeGetActiveSubscriptionForStatus,
  storeListRecentCompletedSubscriptionPayments,
  storeResolveCatalogPlan,
} from "@/lib/db/subscriptions-store";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);

    const subscription = await storeGetActiveSubscriptionForStatus(pharmacyId);
    const scheduled = await getScheduledSubscriptionChange(pharmacyId);

    if (!subscription) {
      return NextResponse.json({
        status: "free",
        plan: {
          name: "Free",
          price: 0,
          period: "forever",
          features: ["Basic POS", "Up to 3 users", "Email support"],
        },
        daysRemaining: null,
        isActive: true,
        expiresAt: null,
        scheduledChange: scheduled
          ? {
              status: scheduled.status,
              effectiveAt: scheduled.effectiveAt,
              changeType: scheduled.changeType,
              targetPlan: scheduled.targetPlan,
              currentPlan: scheduled.currentPlan,
            }
          : null,
      });
    }

    const now = new Date();
    const expiresAt = subscription.expires_at
      ? new Date(subscription.expires_at)
      : null;
    const daysRemaining = expiresAt
      ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const isExpired = expiresAt ? daysRemaining! <= 0 : false;

    const recentPayments = await storeListRecentCompletedSubscriptionPayments({
      pharmacyId,
      subscriptionId: subscription.id,
      limit: 5,
    });

    return NextResponse.json({
      status: isExpired ? "expired" : "active",
      plan: subscription.subscription_plans,
      daysRemaining: daysRemaining != null ? Math.max(0, daysRemaining) : null,
      isActive: Boolean(subscription.is_active) && !isExpired,
      expiresAt: subscription.expires_at,
      subscription: {
        id: subscription.id,
        startedAt: subscription.created_at,
        lastPayment: recentPayments[0]?.created_at ?? null,
        paymentHistory: recentPayments.length,
      },
      timeCounter: expiresAt
        ? {
            days: Math.max(0, daysRemaining ?? 0),
            hours: Math.max(
              0,
              Math.ceil(
                (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60),
              ) % 24,
            ),
            minutes: Math.max(
              0,
              Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60)) %
                60,
            ),
            isExpiring:
              daysRemaining != null && daysRemaining <= 7 && daysRemaining > 0,
            isExpired,
          }
        : null,
      scheduledChange: scheduled
        ? {
            status: scheduled.status,
            effectiveAt: scheduled.effectiveAt,
            changeType: scheduled.changeType,
            targetPlan: scheduled.targetPlan,
            currentPlan: scheduled.currentPlan,
          }
        : null,
    });
  } catch (error: unknown) {
    console.error("Subscription status error:", error);
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { planId } = body;

    const pharmacyId = await requireUserPharmacyId(user.id);

    const plan = await storeResolveCatalogPlan(String(planId));
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const result = await createSubscriptionUpgrade(pharmacyId, {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      period: plan.period,
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: result.id,
        planId: result.planId,
        planName: result.planName,
        amount: result.amount,
        requiresPayment: result.requiresPayment,
      },
    });
  } catch (error: unknown) {
    if (error instanceof SubscriptionPlanChangeError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 },
      );
    }
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
