import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "../../../../../../supabase/server";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";
import {
  cancelPaymentTransaction,
  cancelPendingSubscriptionById,
  cancelPendingSubscriptionsForPharmacy,
} from "@/lib/admin/cancel-pending-billing";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = await resolveIsAppPlatformAdmin(supabase, user.id, null);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as {
      payment_transaction_id?: string;
      subscription_id?: string;
      pharmacy_id?: string;
    };

    const db = createServiceClient();

    if (body.payment_transaction_id) {
      const result = await cancelPaymentTransaction(
        db,
        body.payment_transaction_id,
      );
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, type: "payment" });
    }

    if (body.subscription_id) {
      const result = await cancelPendingSubscriptionById(
        db,
        body.subscription_id,
      );
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, type: "subscription" });
    }

    if (body.pharmacy_id) {
      const result = await cancelPendingSubscriptionsForPharmacy(
        db,
        body.pharmacy_id,
      );
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
