import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  storeGetNotificationPrefs,
  storeUpsertNotificationPrefs,
  type NotificationPrefsRow,
} from "@/lib/db/notifications-store";

const DEFAULT_PREFS: NotificationPrefsRow = {
  channelInApp: true,
  channelEmail: true,
  channelPush: false,
  dailyUpdate: true,
  lowStock: true,
  expiry: true,
  salesReports: false,
  systemUpdates: true,
};

function toApiShape(prefs: NotificationPrefsRow) {
  return {
    dailyUpdate: prefs.dailyUpdate,
    lowStock: prefs.lowStock,
    expiry: prefs.expiry,
    salesReports: prefs.salesReports,
    systemUpdates: prefs.systemUpdates,
    email: prefs.channelEmail,
    desktop: prefs.channelInApp,
    push: prefs.channelPush,
  };
}

function fromApiBody(body: Record<string, unknown>): NotificationPrefsRow {
  return {
    channelInApp: body.desktop !== false,
    channelEmail: body.email !== false,
    channelPush: body.push === true,
    dailyUpdate: body.dailyUpdate !== false,
    lowStock: body.lowStock !== false,
    expiry: body.expiry !== false,
    salesReports: body.salesReports === true,
    systemUpdates: body.systemUpdates !== false,
  };
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const row = await storeGetNotificationPrefs(user.id, pharmacyId);
    return NextResponse.json(toApiShape(row ?? DEFAULT_PREFS));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load notification preferences";
    const status = message === "Pharmacy not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const body = (await request.json()) as Record<string, unknown>;
    const saved = await storeUpsertNotificationPrefs(
      user.id,
      pharmacyId,
      fromApiBody(body),
    );

    return NextResponse.json(toApiShape(saved));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save notification preferences";
    const status = message === "Pharmacy not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
