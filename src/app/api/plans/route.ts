import { NextResponse } from "next/server";
import { createServiceClient } from "../../../../supabase/service";
import { normalizeSubscriptionPlanRow } from "@/lib/subscription/normalize-plan";
import { dedupeSubscriptionPlansByName } from "@/lib/subscription/dedupe-plans";
import { dedupeSubscriptionPlansInDb } from "@/lib/subscription/dedupe-plans-db";

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

<<<<<<< HEAD
    const normalized = plans.map((row) =>
=======
    if (!plans?.length) {
      console.warn(
        "GET /api/plans: catalog still empty after seed attempt; using display fallback"
      );
      return NextResponse.json(fallbackPlansForDisplay());
    }

    let catalog = plans ?? [];
    const dedupedPreview = dedupeSubscriptionPlansByName(catalog);
    if (catalog.length > dedupedPreview.length) {
      try {
        await dedupeSubscriptionPlansInDb(admin);
        const refetchAfterDedupe = await admin
          .from("subscription_plans")
          .select("*")
          .eq("is_active", true)
          .order("price", { ascending: true });
        if (!refetchAfterDedupe.error && refetchAfterDedupe.data?.length) {
          catalog = refetchAfterDedupe.data;
        }
      } catch (dedupeErr) {
        console.warn("GET /api/plans: auto-dedupe failed", dedupeErr);
      }
    }

    const deduped = dedupeSubscriptionPlansByName(catalog);
    const normalized = deduped.map((row) =>
>>>>>>> 313716b48a93eb34c93cede1cb263a21779e3d51
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
