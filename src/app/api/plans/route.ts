import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { fallbackPlansForDisplay } from "@/lib/subscription/default-plans";
import { ensureDefaultSubscriptionPlans } from "@/lib/subscription/ensure-default-plans";
import { normalizeSubscriptionPlanRow } from "@/lib/subscription/normalize-plan";
import { dedupeSubscriptionPlansByName } from "@/lib/subscription/dedupe-plans";
import type { SubscriptionPlan } from "@/lib/saas/types";

const PUBLIC_CACHE_HEADERS = { "Cache-Control": "public, max-age=60, s-maxage=300" };

function buildFallbackPlans(): SubscriptionPlan[] {
  const now = new Date(0).toISOString();
  return fallbackPlansForDisplay().map((plan) => ({
    id: plan.id,
    name: plan.name,
    price: plan.price,
    period: plan.period,
    billing_period: plan.price === 0 ? "free" : "monthly",
    plan_type: plan.plan_type ?? "main",
    max_branches: plan.max_branches ?? 1,
    max_users: plan.max_users ?? 5,
    monthly_tx_limit: plan.monthly_tx_limit ?? 0,
    features: plan.features,
    is_popular: plan.is_popular,
    is_active: plan.is_active,
    created_at: now,
    updated_at: now,
  }));
}

async function loadPublicPlans(
  planTypeFilter: "main" | "branch_addon" | null,
): Promise<SubscriptionPlan[]> {
  let plans = await prisma.subscription_plans.findMany({
    where: {
      is_active: true,
      ...(planTypeFilter ? { plan_type: planTypeFilter } : {}),
    },
    orderBy: { price: "asc" },
  });

  if (!plans.length) {
    await ensureDefaultSubscriptionPlans();
    plans = await prisma.subscription_plans.findMany({
      where: {
        is_active: true,
        ...(planTypeFilter ? { plan_type: planTypeFilter } : {}),
      },
      orderBy: { price: "asc" },
    });
  }

  if (!plans.length) {
    console.warn(
      "GET /api/plans: catalog still empty after seed attempt; using display fallback",
    );
    return planTypeFilter === "branch_addon" ? [] : buildFallbackPlans();
  }

  const catalog = plans.map((row) => ({
    ...row,
    price: Number(row.price),
    updated_at: row.updated_at?.toISOString() ?? null,
    created_at: row.created_at?.toISOString() ?? null,
  }));

  const deduped = dedupeSubscriptionPlansByName(catalog);
  return deduped
    .map((row) => {
      const normalized = normalizeSubscriptionPlanRow(
        row as Record<string, unknown>,
      );
      return {
        ...normalized,
        billing_period:
          normalized.billing_period === "free" ||
          normalized.billing_period === "yearly"
            ? normalized.billing_period
            : "monthly",
        max_branches: normalized.max_branches ?? 1,
        max_users: normalized.max_users ?? 5,
        is_active: row.is_active ?? true,
        created_at: row.created_at ?? new Date(0).toISOString(),
        updated_at: row.updated_at ?? new Date(0).toISOString(),
      } satisfies SubscriptionPlan;
    })
    .filter((plan) => !planTypeFilter || plan.plan_type === planTypeFilter);
}

const loadPublicPlansCached = unstable_cache(
  async (planTypeFilter: "main" | "branch_addon" | null) =>
    loadPublicPlans(planTypeFilter),
  ["public-plans"],
  { revalidate: 300 },
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawPlanType = searchParams.get("plan_type");
  const planTypeFilter =
    rawPlanType === "main" || rawPlanType === "branch_addon"
      ? rawPlanType
      : null;

  try {
    const plans = await loadPublicPlansCached(planTypeFilter);
    return NextResponse.json(plans, { headers: PUBLIC_CACHE_HEADERS });
  } catch (error) {
    console.error("Error fetching plans:", error);
    if (planTypeFilter === "branch_addon") {
      return NextResponse.json([], { headers: PUBLIC_CACHE_HEADERS });
    }
    return NextResponse.json(buildFallbackPlans(), {
      headers: PUBLIC_CACHE_HEADERS,
    });
  }
}
