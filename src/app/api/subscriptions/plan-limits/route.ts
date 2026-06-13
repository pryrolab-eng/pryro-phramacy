import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import {
  canAddPharmacyUser,
  getPharmacyUsage,
  getPlanLimitsForPharmacy,
} from "@/lib/subscription/plan-limits";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const [limits, usage, canAdd] = await Promise.all([
      getPlanLimitsForPharmacy(pharmacyId),
      getPharmacyUsage(pharmacyId),
      canAddPharmacyUser(pharmacyId),
    ]);

    return NextResponse.json({
      limits,
      usage,
      canAddUser: canAdd,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load plan limits";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
