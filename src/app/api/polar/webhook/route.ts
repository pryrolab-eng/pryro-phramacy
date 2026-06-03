import { NextRequest, NextResponse } from "next/server";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { createServiceClient } from "../../../../../supabase/service";
import { fulfillPolarSubscription } from "@/lib/polar/fulfillment";
import { getPolarServer } from "@/lib/polar/client";
import { resolvePolarFulfillment } from "@/lib/webhooks/polar-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Polar dashboard → Webhooks → URL must match this path on your production domain. */
export async function GET() {
  const configured = Boolean(process.env.POLAR_WEBHOOK_SECRET?.trim());
  return NextResponse.json({
    ok: true,
    service: "polar-webhook",
    configured,
    polarServer: getPolarServer(),
    hint: configured
      ? "POST signed events from Polar to this URL."
      : "Set POLAR_WEBHOOK_SECRET in Vercel env (same Polar environment as POLAR_SERVER).",
  });
}

export async function POST(request: NextRequest) {
  const secret = process.env.POLAR_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error("[polar/webhook] POLAR_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  let event: { type?: string; data?: Record<string, unknown> };
  try {
    event = validateEvent(body, headers, secret) as typeof event;
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      console.warn("[polar/webhook] Invalid signature", {
        polarServer: getPolarServer(),
        hasWebhookId: Boolean(headers["webhook-id"]),
        hasWebhookSignature: Boolean(headers["webhook-signature"]),
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
    console.error("[polar/webhook] validateEvent failed", err);
    throw err;
  }

  const admin = createServiceClient();
  const type = event.type ?? "";
  const data = (event.data ?? {}) as Record<string, unknown>;
  const { shouldFulfill, metadata, checkoutId } = resolvePolarFulfillment(
    type,
    data,
  );

  console.info("[polar/webhook] received", {
    type,
    shouldFulfill,
    subscriptionId: metadata.subscription_id ?? null,
    checkoutId,
  });

  if (shouldFulfill && metadata.subscription_id) {
    const result = await fulfillPolarSubscription(
      admin,
      metadata,
      checkoutId ?? undefined,
    );
    if (!result.ok) {
      console.error("[polar/webhook] fulfillment failed:", result.error);
      return NextResponse.json(
        { received: true, fulfilled: false, error: result.error },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ received: true, fulfilled: shouldFulfill });
}
