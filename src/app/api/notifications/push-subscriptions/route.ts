import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  deletePushSubscription,
  listUserPushSubscriptions,
  upsertPushSubscription,
} from "@/lib/db/future-feature-settings";

function getKeys(body: Record<string, unknown>) {
  const keys =
    body.keys && typeof body.keys === "object"
      ? (body.keys as Record<string, unknown>)
      : {};
  return {
    p256dh: String(keys.p256dh ?? body.p256dh ?? "").trim(),
    auth: String(keys.auth ?? body.auth ?? "").trim(),
  };
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const pharmacyId = await requireUserPharmacyId(user.id);
    const subscriptions = await listUserPushSubscriptions(user.id, pharmacyId);
    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("GET /api/notifications/push-subscriptions", error);
    return NextResponse.json(
      { error: "Failed to load push subscriptions" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const pharmacyId = await requireUserPharmacyId(user.id);
    const body = (await request.json()) as Record<string, unknown>;
    const endpoint = String(body.endpoint ?? "").trim();
    const keys = getKeys(body);
    if (!endpoint || !keys.p256dh || !keys.auth) {
      return NextResponse.json(
        { error: "endpoint, p256dh, and auth are required" },
        { status: 400 },
      );
    }

    const subscription = await upsertPushSubscription({
      userId: user.id,
      pharmacyId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        endpoint: subscription.endpoint,
        updatedAt: subscription.updated_at,
      },
    });
  } catch (error) {
    console.error("POST /api/notifications/push-subscriptions", error);
    return NextResponse.json(
      { error: "Failed to save push subscription" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as Record<string, unknown>;
    const endpoint = String(body.endpoint ?? "").trim();
    if (!endpoint) {
      return NextResponse.json({ error: "endpoint is required" }, { status: 400 });
    }

    const deleted = await deletePushSubscription(endpoint, user.id);
    return NextResponse.json({ success: deleted });
  } catch (error) {
    console.error("DELETE /api/notifications/push-subscriptions", error);
    return NextResponse.json(
      { error: "Failed to delete push subscription" },
      { status: 500 },
    );
  }
}
