import { NextRequest } from "next/server";
import { createRouteHandlerClient } from "../../../../../supabase/route-handler";
import { createServiceClient } from "../../../../../supabase/service";
import {
  canAddPharmacyUser,
  getPharmacyUsage,
  getPlanLimitsForPharmacy,
} from "@/lib/subscription/plan-limits";
import { resolveActivePharmacyId } from "@/lib/pharmacy/active-pharmacy";

export async function GET(request: NextRequest) {
  const { supabase, json } = createRouteHandlerClient(request);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createServiceClient();
    const pharmacyId = await resolveActivePharmacyId(admin, user.id);
    if (!pharmacyId) {
      return json({ error: "Pharmacy not found" }, { status: 403 });
    }
    const [limits, usage, canAdd] = await Promise.all([
      getPlanLimitsForPharmacy(admin, pharmacyId),
      getPharmacyUsage(admin, pharmacyId),
      canAddPharmacyUser(admin, pharmacyId),
    ]);

    return json({
      limits,
      usage,
      canAddUser: canAdd,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load plan limits";
    return json({ error: message }, { status: 500 });
  }
}
