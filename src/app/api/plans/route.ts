import { NextResponse } from "next/server";
import { createServiceClient } from "../../../../supabase/service";
import { fallbackPlansForDisplay } from "@/lib/subscription/default-plans";
import { ensureDefaultSubscriptionPlans } from "@/lib/subscription/ensure-default-plans";

export async function GET() {
  try {
    const admin = createServiceClient();

    let { data: plans, error } = await admin
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("price", { ascending: true });

    if (error) {
      throw error;
    }

    if (!plans?.length) {
      await ensureDefaultSubscriptionPlans(admin);
      const refetch = await admin
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });
      if (refetch.error) {
        throw refetch.error;
      }
      plans = refetch.data;
    }

    if (!plans?.length) {
      console.warn(
        "GET /api/plans: catalog still empty after seed attempt; using display fallback"
      );
      return NextResponse.json(fallbackPlansForDisplay());
    }

    return NextResponse.json(plans);
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(fallbackPlansForDisplay());
  }
}
