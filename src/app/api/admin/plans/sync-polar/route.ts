import { NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import { syncPlanToPolarAndSave } from "@/lib/polar/sync-plan-db";
import { isPolarConfigured } from "@/lib/polar/client";
import { dedupeSubscriptionPlansInDb } from "@/lib/subscription/dedupe-plans-db";
import { dedupeSubscriptionPlansByName } from "@/lib/subscription/dedupe-plans";
import { prisma } from "@/lib/db/prisma";

/** Backfill / refresh Polar products for all paid active plans. */
export async function POST() {
  try {
    if (!isPolarConfigured()) {
      return NextResponse.json(
        { error: "Polar is not configured" },
        { status: 503 },
      );
    }

    const auth = await requirePlatformAdminApi();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await dedupeSubscriptionPlansInDb();

    const plans = await prisma.subscription_plans.findMany({
      where: { is_active: true, price: { gt: 0 } },
    });

    const catalog = dedupeSubscriptionPlansByName(
      plans.map((p) => ({
        ...p,
        price: Number(p.price),
        updated_at: p.updated_at?.toISOString() ?? null,
        created_at: p.created_at?.toISOString() ?? null,
      })),
    );

    const results: Array<{
      id: string;
      name: string;
      action?: string;
      error?: string;
      polar_product_id?: string | null;
    }> = [];

    for (const row of catalog) {
      const synced = await syncPlanToPolarAndSave({
        id: row.id,
        name: row.name,
        price: Number(row.price ?? 0),
        period: (row as { period?: string | null }).period ?? null,
        features: (row as { features?: string[] | null }).features ?? null,
        is_active: row.is_active,
        polar_product_id: row.polar_product_id,
      });
      results.push({
        id: row.id,
        name: row.name,
        action: synced.polarSync?.action,
        error: synced.polarSync?.error,
        polar_product_id: synced.plan.polar_product_id,
      });
    }

    const synced = results.filter(
      (r) =>
        (r.action === "created" ||
          r.action === "updated" ||
          r.action === "recreated") &&
        !r.error,
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
      { status: 500 },
    );
  }
}
