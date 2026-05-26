import { NextRequest } from "next/server";
import { createRouteHandlerClient } from "../../../../../supabase/route-handler";
import { createServiceClient } from "../../../../../supabase/service";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";

export type OnboardingStep = 1 | 2 | 3 | 4 | 5;

export async function GET(request: NextRequest) {
  const { supabase, json } = createRouteHandlerClient(request);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createServiceClient();

  const { data: membership } = await admin
    .from("pharmacy_users")
    .select("pharmacy_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const isPlatformAdmin = await resolveIsAppPlatformAdmin(
    supabase,
    user.id,
    membership?.role,
  );

  if (isPlatformAdmin) {
    return json({
      step: 1 as OnboardingStep,
      pharmacy: null,
      pendingPlan: null,
      completed: false,
      isPlatformAdmin: true,
      redirect: "/admin",
    });
  }

  let pharmacyId = membership?.pharmacy_id;

  if (!pharmacyId) {
    const { data: owned } = await admin
      .from("pharmacies")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();

    if (owned?.id) {
      await admin.from("pharmacy_users").upsert(
        {
          pharmacy_id: owned.id,
          user_id: user.id,
          role: "pharmacy_owner",
          is_active: true,
        },
        { onConflict: "pharmacy_id,user_id" }
      );
      pharmacyId = owned.id;
    }
  }

  if (!pharmacyId) {
    return json({
      step: 1 as OnboardingStep,
      pharmacy: null,
      pendingPlan: null,
      completed: false,
      needsPharmacyProfile: true,
    });
  }

  const { data: pharmacy } = await admin
    .from("pharmacies")
    .select(
      "id, name, license_number, city, address, phone, email, status, subscription_plan"
    )
    .eq("id", pharmacyId)
    .single();

  const { data: activeSub } = await admin
    .from("subscriptions")
    .select("id")
    .eq("pharmacy_id", pharmacyId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (activeSub) {
    return json({
      step: 4 as OnboardingStep,
      pharmacy,
      pendingPlan: null,
      completed: false,
      subscriptionActive: true,
    });
  }

  const { data: latestSub } = await admin
    .from("subscriptions")
    .select(
      "id, is_active, plan_id, subscription_plans!plan_id(id, name, price, period, features, is_popular)"
    )
    .eq("pharmacy_id", pharmacyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  type PlanJoin = {
    id: string;
    name: string;
    price: number;
    period: string;
    features: string[] | null;
    is_popular?: boolean | null;
  };

  const planRow = latestSub?.subscription_plans as PlanJoin | PlanJoin[] | null;
  const plan = Array.isArray(planRow) ? planRow[0] : planRow;

  if (plan && latestSub && !latestSub.is_active && Number(plan.price) > 0) {
    return json({
      step: 3 as OnboardingStep,
      pharmacy,
      pendingPlan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        period: plan.period,
        features: plan.features,
        is_popular: plan.is_popular,
        subscriptionId: latestSub.id,
      },
      completed: false,
    });
  }

  return json({
    step: 2 as OnboardingStep,
    pharmacy,
    pendingPlan: null,
    completed: false,
  });
}
