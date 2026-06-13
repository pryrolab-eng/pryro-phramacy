import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import {
  getPolarClient,
  isPolarConfigured,
  polarSuccessUrl,
} from "@/lib/polar/client";
import { formatPolarCheckoutError } from "@/lib/polar/checkout-errors";
import { polarTransactionAmounts } from "@/lib/polar/payment-record";
import {
  INVALID_EMAIL_MESSAGE,
  isValidEmail,
  normalizeEmail,
} from "@/lib/validation/email";
import { storeFindFirstActiveMembership } from "@/lib/db/pharmacy-users-store";
import { storeCreatePaymentTransaction } from "@/lib/db/payment-transactions-store";
import { prisma } from "@/lib/db/prisma";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  if (!isPolarConfigured()) {
    return NextResponse.json(
      {
        error:
          "Card checkout is not configured. Use Mobile Money or contact support.",
      },
      { status: 503 },
    );
  }

  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const planId = body.planId as string | undefined;
    const subscriptionId = body.subscriptionId as string | undefined;
    const returnContext = (body.returnContext as string) || "settings";
    const customerEmailRaw =
      (body.customerEmail as string) || user.email || "";
    const customerEmail = normalizeEmail(customerEmailRaw);
    const customerName = (body.customerName as string) || "Pharmacy customer";

    if (!customerEmail) {
      return NextResponse.json({ error: INVALID_EMAIL_MESSAGE }, { status: 400 });
    }

    if (!isValidEmail(customerEmail)) {
      return NextResponse.json({ error: INVALID_EMAIL_MESSAGE }, { status: 400 });
    }

    if (!planId || !subscriptionId) {
      return NextResponse.json(
        { error: "planId and subscriptionId are required." },
        { status: 400 },
      );
    }

    const membership = await storeFindFirstActiveMembership(user.id);
    if (!membership?.pharmacy_id) {
      return NextResponse.json({ error: "Pharmacy not found" }, { status: 403 });
    }

    const plan = UUID_RE.test(planId)
      ? await prisma.subscription_plans.findFirst({
          where: { is_active: true, id: planId },
          select: { id: true, name: true, price: true, polar_product_id: true },
        })
      : await prisma.subscription_plans.findFirst({
          where: {
            is_active: true,
            name: { equals: planId, mode: "insensitive" },
          },
          select: { id: true, name: true, price: true, polar_product_id: true },
        });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (Number(plan.price) <= 0) {
      return NextResponse.json(
        { error: "Free plans do not require Polar checkout." },
        { status: 400 },
      );
    }

    const polarProductId = plan.polar_product_id;
    if (!polarProductId) {
      return NextResponse.json(
        {
          error: `Plan "${plan.name}" is not synced to Polar yet. Save the plan in Admin → Subscriptions or click "Sync all to Polar".`,
        },
        { status: 400 },
      );
    }

    const polar = getPolarClient();
    const checkout = await polar.checkouts.create({
      products: [polarProductId],
      successUrl: polarSuccessUrl(returnContext),
      customerEmail,
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
    const { amount, currency, paymentDetailsSuffix } = polarTransactionAmounts(
      Number(plan.price),
    );

    const transaction = await storeCreatePaymentTransaction({
      pharmacy_id: membership.pharmacy_id,
      subscription_id: subscriptionId,
      kpay_refid: refid,
      polar_checkout_id: checkout.id,
      payment_provider: "polar",
      amount,
      currency,
      payment_method: "polar",
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: body.customerPhone || null,
      payment_details: `${plan.name} subscription — ${paymentDetailsSuffix}`,
      status: "pending",
      kpay_checkout_url: checkout.url,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: checkout.url,
      checkoutId: checkout.id,
      transactionId: transaction.id,
    });
  } catch (e: unknown) {
    console.error("POST /api/polar/checkout", e);
    return NextResponse.json(
      { error: formatPolarCheckoutError(e) },
      { status: 500 },
    );
  }
}
