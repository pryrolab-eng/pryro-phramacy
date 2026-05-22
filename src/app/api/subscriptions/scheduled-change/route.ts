import { NextRequest } from "next/server";
import { createRouteHandlerClient } from "../../../../../supabase/route-handler";
import { createServiceClient } from "../../../../../supabase/service";
import { cancelScheduledSubscriptionChange } from "@/lib/subscription/cancel-scheduled-change";
import { getScheduledSubscriptionChange } from "@/lib/subscription/get-scheduled-change";

async function resolvePharmacyId(
  supabase: ReturnType<typeof createRouteHandlerClient>["supabase"],
  admin: ReturnType<typeof createServiceClient>,
  userId: string
): Promise<string | null> {
  const { data: userPharmacy } = await admin
    .from("pharmacy_users")
    .select("pharmacy_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return userPharmacy?.pharmacy_id ?? null;
}

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
    const pharmacyId = await resolvePharmacyId(supabase, admin, user.id);

    if (!pharmacyId) {
      return json({ error: "Pharmacy not found" }, { status: 403 });
    }

    const scheduled = await getScheduledSubscriptionChange(admin, pharmacyId);

    return json({
      scheduledChange: scheduled
        ? {
            status: scheduled.status,
            effectiveAt: scheduled.effectiveAt,
            changeType: scheduled.changeType,
            currentPlan: scheduled.currentPlan,
            targetPlan: scheduled.targetPlan,
            subscriptionId: scheduled.subscriptionId,
          }
        : null,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch scheduled change";
    return json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { supabase, json } = createRouteHandlerClient(request);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createServiceClient();
    const pharmacyId = await resolvePharmacyId(supabase, admin, user.id);

    if (!pharmacyId) {
      return json({ error: "Pharmacy not found" }, { status: 403 });
    }

    const { canceled } = await cancelScheduledSubscriptionChange(
      admin,
      pharmacyId
    );

    if (!canceled) {
      return json({ error: "No scheduled change to cancel" }, { status: 404 });
    }

    return json({ success: true, canceled: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to cancel scheduled change";
    return json({ error: message }, { status: 500 });
  }
}
