import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "../../../../../../supabase/server";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";
import { dedupeSubscriptionPlansInDb } from "@/lib/subscription/dedupe-plans-db";
import { findDuplicatePlanGroups } from "@/lib/subscription/dedupe-plans";

/** Deactivate duplicate subscription_plans rows (same name). */
export async function POST() {
  try {
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
    const { data: before } = await db
      .from("subscription_plans")
      .select("id, name, is_active")
      .eq("is_active", true);

    const duplicateGroupsBefore = findDuplicatePlanGroups(before ?? []);

    const result = await dedupeSubscriptionPlansInDb(db);

    return NextResponse.json({
      success: true,
      duplicateGroupsBefore: duplicateGroupsBefore.length,
      ...result,
      message:
        result.deactivated > 0
          ? `Deactivated ${result.deactivated} duplicate plan(s). Delete orphaned products manually in Polar if needed.`
          : "No duplicate active plans found.",
    });
  } catch (e) {
    console.error("POST /api/admin/plans/dedupe", e);
    return NextResponse.json(
      { error: "Failed to deduplicate plans" },
      { status: 500 }
    );
  }
}
