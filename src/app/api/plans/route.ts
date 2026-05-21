import { NextResponse } from "next/server";
import { createServiceClient } from "../../../../supabase/service";
import { fallbackPlansForDisplay } from "@/lib/subscription/default-plans";
import { ensureDefaultSubscriptionPlans } from "@/lib/subscription/ensure-default-plans";
import { normalizeSubscriptionPlanRow } from "@/lib/subscription/normalize-plan";
import { dedupeSubscriptionPlansByName } from "@/lib/subscription/dedupe-plans";
import { dedupeSubscriptionPlansInDb } from "@/lib/subscription/dedupe-plans-db";

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
