import { NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import { dedupeSubscriptionPlansInDb } from "@/lib/subscription/dedupe-plans-db";
import { findDuplicatePlanGroups } from "@/lib/subscription/dedupe-plans";
import { prisma } from "@/lib/db/prisma";

/** Deactivate duplicate subscription_plans rows (same name). */
export async function POST() {
  try {
    const auth = await requirePlatformAdminApi();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const before = await prisma.subscription_plans.findMany({
      where: { is_active: true },
      select: { id: true, name: true, is_active: true },
    });

    const duplicateGroupsBefore = findDuplicatePlanGroups(before);
    const result = await dedupeSubscriptionPlansInDb();

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
      { status: 500 },
    );
  }
}
