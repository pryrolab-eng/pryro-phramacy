import { NextRequest } from "next/server";
import { createRouteHandlerClient } from "../../../../../supabase/route-handler";
import { createServiceClient } from "../../../../../supabase/service";
import {
  getPolarClient,
  isPolarConfigured,
  polarSuccessUrl,
} from "@/lib/polar/client";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const { supabase, json } = createRouteHandlerClient(request);

  if (!isPolarConfigured()) {
    return json(
      {
        error:
          "Card checkout is not configured. Use Mobile Money or contact support.",
      },
      { status: 503 }
    );
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const planId = body.planId as string | undefined;
    const subscriptionId = body.subscriptionId as string | undefined;
    const returnContext = (body.returnContext as string) || "settings";
    const customerEmail = (body.customerEmail as string) || user.email || "";
    const customerName = (body.customerName as string) || "Pharmacy customer";

    if (!planId || !subscriptionId) {
      return json(
        { error: "planId and subscriptionId are required." },
        { status: 400 }
      );
    }

    const admin = createServiceClient();

    const { data: membership } = await admin
      .from("pharmacy_users")
      .select("pharmacy_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!membership?.pharmacy_id) {
      return json({ error: "Pharmacy not found" }, { status: 403 });
    }

    let planQuery = admin
      .from("subscription_plans")
      .select("id, name, price, polar_product_id")
      .eq("is_active", true);

    if (UUID_RE.test(planId)) {
      planQuery = planQuery.eq("id", planId);
    } else {
      planQuery = planQuery.ilike("name", planId);
    }

    const { data: plan, error: planError } = await planQuery.maybeSingle();

    if (planError || !plan) {
      return json({ error: "Plan not found" }, { status: 404 });
    }

    if (Number(plan.price) <= 0) {
      return json(
        { error: "Free plans do not require Polar checkout." },
        { status: 400 }
      );
    }

    const polarProductId = plan.polar_product_id as string | null;
    if (!polarProductId) {
      return json(
        {
          error: `Plan "${plan.name}" is not synced to Polar yet. Save the plan in Admin → Subscriptions or click "Sync all to Polar".`,
        },
        { status: 400 }
      );
    }

    const polar = getPolarClient();
    const checkout = await polar.checkouts.create({
      products: [polarProductId],
      successUrl: polarSuccessUrl(returnContext),
      customerEmail: customerEmail || undefined,
      customerName,
      metadata: {
        pharmacy_id: membership.pharmacy_id,
        subscription_id: subscriptionId,
        plan_name: plan.name,
        return_context: returnContext,
        user_id: user.id,
      },
    });

    const refid = `polar-${checkout.id}`;
    const { data: transaction, error: txError } = await admin
      .from("payment_transactions")
      .insert({
        pharmacy_id: membership.pharmacy_id,
        subscription_id: subscriptionId,
        kpay_refid: refid,
        polar_checkout_id: checkout.id,
        payment_provider: "polar",
        amount: plan.price,
        currency: "USD",
        payment_method: "polar",
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: body.customerPhone || null,
        payment_details: `${plan.name} subscription (Polar)`,
        status: "pending",
        kpay_checkout_url: checkout.url,
      })
      .select("id")
      .single();

    if (txError) {
      console.error("Polar checkout: payment_transactions insert", txError);
      return json({ error: "Could not record payment" }, { status: 500 });
    }

    return json({
      success: true,
      checkoutUrl: checkout.url,
      checkoutId: checkout.id,
      transactionId: transaction?.id,
    });
  } catch (e: unknown) {
    console.error("POST /api/polar/checkout", e);
    const message = e instanceof Error ? e.message : "Checkout failed";
    return json({ error: message }, { status: 500 });
  }
}
