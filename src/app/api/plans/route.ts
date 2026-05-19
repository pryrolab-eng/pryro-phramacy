import { NextResponse } from "next/server";
import { createServiceClient } from "../../../../supabase/service";
import { fallbackPlansForDisplay } from "@/lib/subscription/default-plans";
import { ensureDefaultSubscriptionPlans } from "@/lib/subscription/ensure-default-plans";
import { normalizeSubscriptionPlanRow } from "@/lib/subscription/normalize-plan";

export const dynamic = "force-dynamic";

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

    const normalized = (plans ?? []).map((row) =>
      normalizeSubscriptionPlanRow(row as Record<string, unknown>)
    );

    return NextResponse.json(normalized, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(fallbackPlansForDisplay(), {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }
}
