import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { storeCreatePharmacyNotification, storeListNotificationsForPharmacy } from "@/lib/db/notifications-store";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const notifications = await storeListNotificationsForPharmacy(pharmacyId);

    const formattedNotifications = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.is_read,
      date: n.created_at,
    }));

    return NextResponse.json(formattedNotifications);
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
