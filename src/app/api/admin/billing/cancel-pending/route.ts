import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";
import {
  cancelPaymentTransaction,
  cancelPendingSubscriptionById,
  cancelPendingSubscriptionsForPharmacy,
} from "@/lib/admin/cancel-pending-billing";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = await resolveIsAppPlatformAdmin(user.id);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as {
      payment_transaction_id?: string;
      subscription_id?: string;
      pharmacy_id?: string;
    };

    if (body.payment_transaction_id) {
      const result = await cancelPaymentTransaction(body.payment_transaction_id);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, type: "payment" });
    }

    if (body.subscription_id) {
      const result = await cancelPendingSubscriptionById(body.subscription_id);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, type: "subscription" });
    }

    if (body.pharmacy_id) {
      const result = await cancelPendingSubscriptionsForPharmacy(body.pharmacy_id);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        type: "pharmacy",
        cancelled: result.cancelled,
      });
    }

    return NextResponse.json(
      { error: "Provide payment_transaction_id, subscription_id, or pharmacy_id" },
      { status: 400 },
    );
  } catch (e) {
    console.error("POST /api/admin/billing/cancel-pending", e);
    return NextResponse.json({ error: "Cancel failed" }, { status: 500 });
  }
}
