import { NextRequest, NextResponse } from "next/server";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { createServiceClient } from "../../../../../supabase/service";
import {
  fulfillPolarSubscription,
  parsePolarMetadata,
} from "@/lib/polar/fulfillment";

export async function POST(request: NextRequest) {
  const secret = process.env.POLAR_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error("POLAR_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  let event: { type?: string; data?: Record<string, unknown> };
  try {
    event = validateEvent(body, headers, secret) as typeof event;
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
    throw err;
  }

  const admin = createServiceClient();
  const type = event.type ?? "";
  const data = (event.data ?? {}) as Record<string, unknown>;

  const metadata = parsePolarMetadata(
    (data.metadata as Record<string, unknown>) ??
      ((data.checkout as Record<string, unknown>)?.metadata as Record<
        string,
        unknown
      >)
  );

  const checkoutId =
    (typeof data.id === "string" ? data.id : null) ||
    (typeof (data.checkout as Record<string, unknown>)?.id === "string"
      ? ((data.checkout as Record<string, unknown>).id as string)
      : null);

  const shouldFulfill =
    type === "order.paid" ||
    type === "subscription.active" ||
    (type === "checkout.updated" &&
      (data.status === "succeeded" || data.status === "confirmed"));

  if (shouldFulfill && metadata.subscription_id) {
    const result = await fulfillPolarSubscription(
      admin,
      metadata,
      checkoutId ?? undefined
    );
    if (!result.ok) {
      console.error("Polar webhook fulfillment:", result.error);
    }
  }

  return NextResponse.json({ received: true });
}
