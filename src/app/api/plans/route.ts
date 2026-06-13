import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { fallbackPlansForDisplay } from "@/lib/subscription/default-plans";
import { ensureDefaultSubscriptionPlans } from "@/lib/subscription/ensure-default-plans";
import { normalizeSubscriptionPlanRow } from "@/lib/subscription/normalize-plan";
import { dedupeSubscriptionPlansByName } from "@/lib/subscription/dedupe-plans";
import { dedupeSubscriptionPlansInDb } from "@/lib/subscription/dedupe-plans-db";
import { enrichPlansWithCatalogFeatures } from "@/lib/subscription/enrich-plans-catalog";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const planTypeFilter = searchParams.get("plan_type");

    let plans = await prisma.subscription_plans.findMany({
      where: {
        is_active: true,
        ...(planTypeFilter === "main" || planTypeFilter === "branch_addon"
          ? { plan_type: planTypeFilter }
          : {}),
      },
      orderBy: { price: "asc" },
    });

    if (!plans.length) {
      await ensureDefaultSubscriptionPlans();
      plans = await prisma.subscription_plans.findMany({
        where: {
          is_active: true,
          ...(planTypeFilter === "main" || planTypeFilter === "branch_addon"
            ? { plan_type: planTypeFilter }
            : {}),
        },
        orderBy: { price: "asc" },
      });
    }

    if (!plans.length) {
      console.warn(
        "GET /api/plans: catalog still empty after seed attempt; using display fallback",
      );
      return NextResponse.json(fallbackPlansForDisplay(), { headers: NO_STORE });
    }

    const catalogRows = plans.map((row) => ({
      ...row,
      price: Number(row.price),
      updated_at: row.updated_at?.toISOString() ?? null,
      created_at: row.created_at?.toISOString() ?? null,
    }));

    let catalog = catalogRows;
    const dedupedPreview = dedupeSubscriptionPlansByName(catalog);
    if (catalog.length > dedupedPreview.length) {
      try {
        await dedupeSubscriptionPlansInDb();
        const refetch = await prisma.subscription_plans.findMany({
          where: { is_active: true },
          orderBy: { price: "asc" },
        });
        if (refetch.length) {
          catalog = refetch.map((row) => ({
            ...row,
            price: Number(row.price),
            updated_at: row.updated_at?.toISOString() ?? null,
            created_at: row.created_at?.toISOString() ?? null,
          }));
        }
      } catch (dedupeErr) {
        console.warn("GET /api/plans: auto-dedupe failed", dedupeErr);
      }
    }

    const deduped = dedupeSubscriptionPlansByName(catalog);
    let normalized = deduped.map((row) =>
      normalizeSubscriptionPlanRow(row as Record<string, unknown>),
    );
    if (planTypeFilter === "main" || planTypeFilter === "branch_addon") {
      normalized = normalized.filter((p) => p.plan_type === planTypeFilter);
    }

    const withCatalog = await enrichPlansWithCatalogFeatures(
      normalized.map((p) => ({ ...p, id: p.id })),
    );

    return NextResponse.json(withCatalog, { headers: NO_STORE });
  } catch (error) {
    console.error("Error fetching plans:", error);
    const { searchParams } = new URL(request.url);
    const planTypeFilter = searchParams.get("plan_type");
    if (planTypeFilter === "branch_addon") {
      return NextResponse.json([], { headers: NO_STORE });
    }
    return NextResponse.json(fallbackPlansForDisplay(), { headers: NO_STORE });
  }
}
