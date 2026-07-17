import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  storeCreatePharmacyNotification,
  storeListNotificationsForPharmacy,
  storeListPlatformNotifications,
} from "@/lib/db/notifications-store";

function formatNotifications(
  notifications: Awaited<ReturnType<typeof storeListNotificationsForPharmacy>>,
) {
  return notifications.map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    read: n.is_read,
    date: n.created_at,
    actionUrl: n.action_url,
  }));
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wantPlatform =
      request.nextUrl.searchParams.get("scope") === "platform";
    const isPlatformAdmin = wantPlatform
      ? await resolveIsAppPlatformAdmin(user.id)
      : false;

    if (wantPlatform) {
      if (!isPlatformAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const notifications = await storeListPlatformNotifications();
      return NextResponse.json(formatNotifications(notifications));
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const notifications = await storeListNotificationsForPharmacy(pharmacyId);
    return NextResponse.json(formatNotifications(notifications));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch notifications";
    const status = message === "Pharmacy not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const body = await request.json();

    const notification = await storeCreatePharmacyNotification({
      pharmacyId,
      title: body.title,
      message: body.message,
      type: body.type,
    });

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create notification";
    const status = message === "Pharmacy not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
