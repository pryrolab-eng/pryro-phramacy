import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "../../../../../../supabase/server";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";
import { syncPlanToPolarAndSave } from "@/lib/polar/sync-plan-db";
import { isPolarConfigured } from "@/lib/polar/client";

/** Backfill / refresh Polar products for all paid active plans. */
export async function POST() {
  try {
    if (!isPolarConfigured()) {
      return NextResponse.json(
        { error: "Polar is not configured" },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = await resolveIsAppPlatformAdmin(supabase, user.id, null);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = createServiceClient();
    const { data: plans, error } = await db
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .gt("price", 0);

    if (error) throw error;

    const results: Array<{
      id: string;
      name: string;
      action?: string;
      error?: string;
      polar_product_id?: string | null;
    }> = [];

    for (const row of plans ?? []) {
      const synced = await syncPlanToPolarAndSave(db, row);
      results.push({
        id: row.id,
        name: row.name,
        action: synced.polarSync?.action,
        error: synced.polarSync?.error,
        polar_product_id: synced.plan.polar_product_id,
      });
    }

    const synced = results.filter(
      (r) => (r.action === "created" || r.action === "updated") && !r.error
    ).length;
    const skipped = results.filter((r) => r.action === "skipped").length;
    const failed = results.filter((r) => r.error).length;

    return NextResponse.json({
      success: true,
      synced,
      failed,
      skipped,
      results,
    });
  } catch (e) {
    console.error("POST /api/admin/plans/sync-polar", e);
    return NextResponse.json(
      { error: "Failed to sync plans to Polar" },
      { status: 500 }
    );
  }
}
