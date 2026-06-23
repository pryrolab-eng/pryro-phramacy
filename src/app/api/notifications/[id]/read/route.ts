import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { storeMarkNotificationRead } from "@/lib/db/notifications-store";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const pharmacyId = await requireUserPharmacyId(user.id);
    const updated = await storeMarkNotificationRead(id, pharmacyId);

    if (!updated) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to mark notification read";
    const status = message === "Pharmacy not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
