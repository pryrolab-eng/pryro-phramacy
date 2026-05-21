import { NextResponse } from "next/server";
import { createServiceClient } from "../../../../supabase/service";
import { normalizeSubscriptionPlanRow } from "@/lib/subscription/normalize-plan";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = createServiceClient();

    const { data: plans, error } = await admin
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("price", { ascending: true });

    if (error) {
      throw error;
    }

    if (!plans?.length) {
      // No plans yet — admin needs to create them through the dashboard
      return NextResponse.json([], {
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
    }

    const normalized = plans.map((row) =>
      normalizeSubscriptionPlanRow(row as Record<string, unknown>)
    );

    return NextResponse.json(normalized, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      { error: "Failed to load plans" },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}
