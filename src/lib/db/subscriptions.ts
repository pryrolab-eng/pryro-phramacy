import type { EntitlementPlan } from "@/lib/subscription/lifecycle/types";
import type { CatalogPlanInput } from "@/lib/subscription/lifecycle/types";
import { prisma } from "@/lib/db/prisma";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function serializeSubscriptionPlanRow(
  row: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row };
  if (row.price != null) out.price = Number(row.price);
  if (row.yearly_price != null) out.yearly_price = Number(row.yearly_price);
  if (row.created_at instanceof Date) {
    out.created_at = row.created_at.toISOString();
  }
  if (row.updated_at instanceof Date) {
    out.updated_at = row.updated_at.toISOString();
  }
  return out;
}

export type MainSubscriptionCandidate = {
  id: string;
  pharmacy_id: string;
  plan_id: string | null;
  plan: string;
  status: string | null;
  is_active: boolean | null;
  expires_at: string | null;
  payment_method: string | null;
  next_plan_id: string | null;
  change_scheduled_at: string | null;
  change_type: string | null;
  pending_change_status: string | null;
  subscription_plans: EntitlementPlan | null;
};

function mapEntitlementPlan(
  plan: {
    id: string;
    name: string;
    price: unknown;
    period: string;
    max_users: number | null;
    max_branches: number | null;
    monthly_tx_limit: number;
  } | null,
): EntitlementPlan | null {
  if (!plan) return null;
  return {
    id: plan.id,
    name: plan.name,
    price: Number(plan.price ?? 0),
    period: plan.period,
    max_users: plan.max_users ?? undefined,
    max_branches: plan.max_branches ?? undefined,
    monthly_tx_limit: plan.monthly_tx_limit,
  };
}

export type SubscriptionPlanDisplay = {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
};

export type ActiveSubscriptionStatusRow = {
  id: string;
  pharmacy_id: string | null;
  plan_id: string | null;
  is_active: boolean | null;
  expires_at: string | null;
  created_at: string | null;
  subscription_plans: SubscriptionPlanDisplay | null;
};

export type CompletedPaymentRow = {
  id: string;
  created_at: string | null;
  status: string | null;
};

function mapPlan(
  plan: {
    id: string;
    name: string;
    price: unknown;
    period: string;
    features: string[];
  } | null,
): SubscriptionPlanDisplay | null {
  if (!plan) return null;
  return {
    id: plan.id,
    name: plan.name,
    price: Number(plan.price ?? 0),
    period: plan.period,
    features: plan.features ?? [],
  };
}

export async function getActiveSubscriptionForStatus(
  pharmacyId: string,
): Promise<ActiveSubscriptionStatusRow | null> {
  const row = await prisma.subscriptions.findFirst({
    where: {
      pharmacy_id: pharmacyId,
      is_active: true,
    },
    orderBy: { created_at: "desc" },
    include: {
      subscription_plans_subscriptions_plan_idTosubscription_plans: {
        select: {
          id: true,
          name: true,
          price: true,
          period: true,
          features: true,
        },
      },
    },
  });

  if (!row) return null;

  return {
    id: row.id,
    pharmacy_id: row.pharmacy_id,
    plan_id: row.plan_id,
    is_active: row.is_active,
    expires_at: row.expires_at?.toISOString() ?? null,
    created_at: row.created_at?.toISOString() ?? null,
    subscription_plans: mapPlan(
      row.subscription_plans_subscriptions_plan_idTosubscription_plans,
    ),
  };
}

export async function listRecentCompletedSubscriptionPayments(input: {
  pharmacyId: string;
  subscriptionId: string;
  limit?: number;
}): Promise<CompletedPaymentRow[]> {
  const rows = await prisma.payment_transactions.findMany({
    where: {
      pharmacy_id: input.pharmacyId,
      subscription_id: input.subscriptionId,
      status: "completed",
    },
    orderBy: { created_at: "desc" },
    take: input.limit ?? 5,
    select: {
      id: true,
      created_at: true,
      status: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    created_at: row.created_at?.toISOString() ?? null,
    status: row.status,
  }));
}

export async function getPharmacyStatus(pharmacyId: string): Promise<string> {
  const row = await prisma.pharmacies.findUnique({
    where: { id: pharmacyId },
    select: { status: true },
  });
  return String(row?.status ?? "active").toLowerCase();
}

export async function listMainSubscriptionCandidates(
  pharmacyId: string,
): Promise<MainSubscriptionCandidate[]> {
  const rows = await prisma.subscriptions.findMany({
    where: {
      pharmacy_id: pharmacyId,
      subscription_type: "main",
    },
    orderBy: { created_at: "desc" },
    include: {
      subscription_plans_subscriptions_plan_idTosubscription_plans: {
        select: {
          id: true,
          name: true,
          price: true,
          period: true,
          max_users: true,
          max_branches: true,
          monthly_tx_limit: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    pharmacy_id: row.pharmacy_id ?? pharmacyId,
    plan_id: row.plan_id,
    plan: row.plan != null ? String(row.plan) : "",
    status: row.status,
    is_active: row.is_active,
    expires_at: row.expires_at?.toISOString() ?? null,
    payment_method: row.payment_method,
    next_plan_id: row.next_plan_id,
    change_scheduled_at: row.change_scheduled_at?.toISOString() ?? null,
    change_type: row.change_type,
    pending_change_status: row.pending_change_status,
    subscription_plans: mapEntitlementPlan(
      row.subscription_plans_subscriptions_plan_idTosubscription_plans,
    ),
  }));
}

export async function getEntitlementPlanById(
  planId: string,
): Promise<EntitlementPlan | null> {
  const plan = await prisma.subscription_plans.findUnique({
    where: { id: planId },
    select: {
      id: true,
      name: true,
      price: true,
      period: true,
      max_users: true,
      max_branches: true,
      monthly_tx_limit: true,
    },
  });
  return mapEntitlementPlan(plan);
}

export async function resolveCatalogPlanFromDb(
  planIdOrName: string,
): Promise<CatalogPlanInput> {
  const isUuid = UUID_RE.test(planIdOrName);
  const plan = await prisma.subscription_plans.findFirst({
    where: {
      is_active: true,
      ...(isUuid
        ? { id: planIdOrName }
        : { name: { equals: planIdOrName, mode: "insensitive" } }),
    },
    select: {
      id: true,
      name: true,
      price: true,
      period: true,
      billing_period: true,
    },
  });

  if (!plan) {
    throw new Error("Plan not found or is not available");
  }

  return {
    id: plan.id,
    name: plan.name,
    price: Number(plan.price),
    period: plan.period,
    billing_period: plan.billing_period,
  };
}

export async function findBranchAddonPlanFromDb(
  planIdOrName: string,
): Promise<Record<string, unknown> | null> {
  const isUuid = UUID_RE.test(planIdOrName);
  const plan = await prisma.subscription_plans.findFirst({
    where: {
      is_active: true,
      plan_type: "branch_addon",
      ...(isUuid
        ? { id: planIdOrName }
        : { name: { equals: planIdOrName, mode: "insensitive" } }),
    },
  });
  return plan ? serializeSubscriptionPlanRow(plan as unknown as Record<string, unknown>) : null;
}

export async function getCatalogPlanDetailsById(
  planId: string,
): Promise<{
  id: string;
  name: string;
  price: number;
  period: string;
  billing_period: string;
  plan_type: string;
  monthly_tx_limit: number;
} | null> {
  const plan = await prisma.subscription_plans.findUnique({
    where: { id: planId },
    select: {
      id: true,
      name: true,
      price: true,
      period: true,
      billing_period: true,
      plan_type: true,
      monthly_tx_limit: true,
    },
  });

  if (!plan) return null;

  return {
    id: plan.id,
    name: plan.name,
    price: Number(plan.price),
    period: plan.period,
    billing_period: plan.billing_period,
    plan_type: plan.plan_type,
    monthly_tx_limit: plan.monthly_tx_limit,
  };
}

export async function listActiveCatalogPlansFromDb(input?: {
  planType?: "main" | "branch_addon";
}): Promise<Record<string, unknown>[]> {
  const rows = await prisma.subscription_plans.findMany({
    where: {
      is_active: true,
      ...(input?.planType ? { plan_type: input.planType } : {}),
    },
    orderBy: { price: "asc" },
  });

  return rows.map((row) =>
    serializeSubscriptionPlanRow(row as unknown as Record<string, unknown>),
  );
}
