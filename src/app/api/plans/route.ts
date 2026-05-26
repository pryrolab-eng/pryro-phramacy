import { NextResponse } from "next/server";
import { createServiceClient } from "../../../../supabase/service";
import { fallbackPlansForDisplay } from "@/lib/subscription/default-plans";
import { ensureDefaultSubscriptionPlans } from "@/lib/subscription/ensure-default-plans";
import { normalizeSubscriptionPlanRow } from "@/lib/subscription/normalize-plan";
import { dedupeSubscriptionPlansByName } from "@/lib/subscription/dedupe-plans";
import { dedupeSubscriptionPlansInDb } from "@/lib/subscription/dedupe-plans-db";
import { enrichPlansWithCatalogFeatures } from "@/lib/subscription/enrich-plans-catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = createServiceClient();
    const { searchParams } = new URL(request.url);
    const planTypeFilter = searchParams.get("plan_type");

    let query = admin
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("price", { ascending: true });

    if (planTypeFilter === "main" || planTypeFilter === "branch_addon") {
      query = query.eq("plan_type", planTypeFilter);
    }

    let { data: plans, error } = await query;

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
    let normalized = deduped.map((row) =>
      normalizeSubscriptionPlanRow(row as Record<string, unknown>)
    );
    if (planTypeFilter === "main" || planTypeFilter === "branch_addon") {
      normalized = normalized.filter((p) => p.plan_type === planTypeFilter);
    }

    const withCatalog = await enrichPlansWithCatalogFeatures(
      admin,
      normalized.map((p) => ({ ...p, id: p.id })),
    );

    return NextResponse.json(withCatalog, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    const { searchParams } = new URL(request.url);
    const planTypeFilter = searchParams.get("plan_type");
    if (planTypeFilter === "branch_addon") {
      return NextResponse.json([], {
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
    }
    return NextResponse.json(fallbackPlansForDisplay(), {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }
}
