import { prisma } from "@/lib/db/prisma";
import {
  periodLabelFromBilling,
  type BillingPeriod,
} from "@/lib/subscription/plan-period";
import type {
  ActivateSubscriptionParams,
  Branch,
  BranchUsage,
  PharmacySubscriptionSummary,
  Subscription,
  SubscriptionInvoice,
  SubscriptionPlan,
} from "@/lib/saas/types";
import { getBranchCapacityFromDb } from "@/lib/db/branch-capacity";
import { resolvePharmacyEntitlements } from "@/lib/subscription/lifecycle/entitlements";
import { createSubscriptionOrchestrator } from "@/lib/subscription/orchestrator";
import { storeCreatePharmacyBranch } from "@/lib/db/subscription-writes-store";
import { provisionBranchUsageForBranch } from "@/lib/subscription/provision-branch-usage";
import {
  rpcCheckBranchCanTransact,
  rpcIncrementBranchTx,
} from "@/lib/db/saas-rpc";

function iso(value: Date | null | undefined): string {
  return value?.toISOString() ?? "";
}

function dateOnly(value: Date | null | undefined): string {
  if (!value) return "";
  return value.toISOString().split("T")[0];
}

function mapPlan(row: {
  id: string;
  name: string;
  price: unknown;
  period: string;
  billing_period: string;
  plan_type: string;
  max_branches: number | null;
  max_users: number | null;
  monthly_tx_limit: number;
  features: string[];
  is_popular: boolean | null;
  is_active: boolean | null;
  created_at: Date | null;
  updated_at: Date | null;
}): SubscriptionPlan {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price ?? 0),
    period: row.period,
    billing_period: row.billing_period as SubscriptionPlan["billing_period"],
    plan_type: row.plan_type as SubscriptionPlan["plan_type"],
    max_branches: Number(row.max_branches ?? 1),
    max_users: Number(row.max_users ?? 5),
    monthly_tx_limit: row.monthly_tx_limit,
    features: row.features ?? [],
    is_popular: Boolean(row.is_popular),
    is_active: Boolean(row.is_active),
    created_at: iso(row.created_at),
    updated_at: iso(row.updated_at),
  };
}

function mapSubscription(
  row: {
    id: string;
    pharmacy_id: string | null;
    plan_id: string | null;
    branch_id: string | null;
    subscription_type: string;
    status: string | null;
    is_active: boolean | null;
    current_period_start: Date | null;
    current_period_end: Date | null;
    cancelled_at: Date | null;
    trial_ends_at: Date | null;
    created_at: Date | null;
    updated_at: Date | null;
  },
  plan?: SubscriptionPlan,
): Subscription {
  return {
    id: row.id,
    pharmacy_id: row.pharmacy_id ?? "",
    plan_id: row.plan_id ?? "",
    branch_id: row.branch_id,
    subscription_type: row.subscription_type as Subscription["subscription_type"],
    status: (row.status ?? "pending") as Subscription["status"],
    is_active: Boolean(row.is_active),
    current_period_start: row.current_period_start
      ? iso(row.current_period_start)
      : null,
    current_period_end: row.current_period_end
      ? iso(row.current_period_end)
      : null,
    cancelled_at: row.cancelled_at ? iso(row.cancelled_at) : null,
    trial_ends_at: row.trial_ends_at ? iso(row.trial_ends_at) : null,
    created_at: iso(row.created_at),
    updated_at: iso(row.updated_at),
    plan,
  };
}

function mapBranch(row: {
  id: string;
  pharmacy_id: string | null;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean | null;
  is_headquarters: boolean;
  created_at: Date | null;
  updated_at: Date | null;
}): Branch {
  return {
    id: row.id,
    pharmacy_id: row.pharmacy_id ?? "",
    name: row.name,
    address: row.address,
    phone: row.phone,
    email: row.email,
    is_active: Boolean(row.is_active),
    is_headquarters: row.is_headquarters,
    created_at: iso(row.created_at),
    updated_at: iso(row.updated_at),
  };
}

function mapBranchUsage(row: {
  id: string;
  branch_id: string;
  pharmacy_id: string;
  subscription_id: string | null;
  billing_cycle_start: Date;
  billing_cycle_end: Date;
  tx_count: number;
  tx_limit: number;
  is_blocked: boolean;
  reset_at: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
}): BranchUsage {
  return {
    id: row.id,
    branch_id: row.branch_id,
    pharmacy_id: row.pharmacy_id,
    subscription_id: row.subscription_id,
    billing_cycle_start: dateOnly(row.billing_cycle_start),
    billing_cycle_end: dateOnly(row.billing_cycle_end),
    tx_count: row.tx_count,
    tx_limit: row.tx_limit,
    is_blocked: row.is_blocked,
    reset_at: row.reset_at ? iso(row.reset_at) : null,
    created_at: iso(row.created_at),
    updated_at: iso(row.updated_at),
  };
}

function mapInvoice(row: {
  id: string;
  pharmacy_id: string;
  invoice_number: string;
  billing_month: string;
  subtotal: unknown;
  total: unknown;
  status: string;
  due_date: Date;
  paid_at: Date | null;
  notes: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}): SubscriptionInvoice {
  return {
    id: row.id,
    pharmacy_id: row.pharmacy_id,
    invoice_number: row.invoice_number,
    billing_month: row.billing_month,
    subtotal: Number(row.subtotal ?? 0),
    total: Number(row.total ?? 0),
    status: row.status as SubscriptionInvoice["status"],
    due_date: dateOnly(row.due_date),
    paid_at: row.paid_at ? iso(row.paid_at) : null,
    notes: row.notes,
    created_at: iso(row.created_at),
    updated_at: iso(row.updated_at),
  };
}

function invoiceNumber(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `SINV-${ymd}-${suffix}`;
}

const subscriptionInclude = {
  subscription_plans_subscriptions_plan_idTosubscription_plans: true,
} as const;

async function fetchSubscriptionWithPlan(
  subscriptionId: string,
): Promise<Subscription | null> {
  const row = await prisma.subscriptions.findUnique({
    where: { id: subscriptionId },
    include: subscriptionInclude,
  });
  if (!row) return null;
  const planRow =
    row.subscription_plans_subscriptions_plan_idTosubscription_plans;
  return mapSubscription(row, planRow ? mapPlan(planRow) : undefined);
}

export async function saasGetActivePlans(): Promise<SubscriptionPlan[]> {
  const rows = await prisma.subscription_plans.findMany({
    where: { is_active: true },
    orderBy: { price: "asc" },
  });
  return rows.map(mapPlan);
}

export async function saasGetAllPlans(): Promise<SubscriptionPlan[]> {
  const rows = await prisma.subscription_plans.findMany({
    orderBy: { price: "asc" },
  });
  return rows.map(mapPlan);
}

export async function saasGetPlanById(
  planId: string,
): Promise<SubscriptionPlan | null> {
  const row = await prisma.subscription_plans.findUnique({
    where: { id: planId },
  });
  return row ? mapPlan(row) : null;
}

export async function saasCreatePlan(input: {
  name: string;
  price: number;
  billing_period: string;
  plan_type: string;
  max_branches: number;
  max_users: number;
  monthly_tx_limit: number;
  features: string[];
  is_popular?: boolean;
}): Promise<SubscriptionPlan> {
  const period = periodLabelFromBilling(input.billing_period as BillingPeriod);
  const row = await prisma.subscription_plans.create({
    data: {
      name: input.name,
      price: input.price,
      period,
      billing_period: input.billing_period,
      plan_type: input.plan_type,
      max_branches: input.max_branches,
      max_users: input.max_users,
      monthly_tx_limit: input.monthly_tx_limit,
      features: input.features,
      is_popular: input.is_popular ?? false,
      is_active: true,
    },
  });
  return mapPlan(row);
}

export async function saasUpdatePlan(
  planId: string,
  updates: Partial<{
    name: string;
    price: number;
    billing_period: string;
    plan_type: string;
    max_branches: number;
    max_users: number;
    monthly_tx_limit: number;
    features: string[];
    is_popular: boolean;
    is_active: boolean;
  }>,
): Promise<SubscriptionPlan> {
  const data: Record<string, unknown> = { ...updates };
  if (updates.billing_period) {
    data.period = periodLabelFromBilling(
      updates.billing_period as BillingPeriod,
    );
  }
  const row = await prisma.subscription_plans.update({
    where: { id: planId },
    data,
  });
  return mapPlan(row);
}

export async function saasGetPharmacySubscriptions(
  pharmacyId: string,
): Promise<Subscription[]> {
  const rows = await prisma.subscriptions.findMany({
    where: {
      pharmacy_id: pharmacyId,
      status: { in: ["active", "pending_payment", "scheduled_change", "pending"] },
    },
    orderBy: { created_at: "desc" },
    include: subscriptionInclude,
  });

  return rows.map((row) => {
    const planRow =
      row.subscription_plans_subscriptions_plan_idTosubscription_plans;
    return mapSubscription(row, planRow ? mapPlan(planRow) : undefined);
  });
}

export async function saasGetPharmacyMainSubscription(
  pharmacyId: string,
): Promise<Subscription | null> {
  const ent = await resolvePharmacyEntitlements(pharmacyId);
  if (!ent.subscriptionId) return null;
  return fetchSubscriptionWithPlan(ent.subscriptionId);
}

export async function saasGetPharmacyBranches(
  pharmacyId: string,
): Promise<Branch[]> {
  const rows = await prisma.branches.findMany({
    where: { pharmacy_id: pharmacyId, is_active: true },
    orderBy: [{ is_headquarters: "desc" }, { created_at: "asc" }],
  });
  return rows.map(mapBranch);
}

export async function saasGetBranchCurrentUsage(
  branchId: string,
): Promise<BranchUsage | null> {
  const today = new Date();
  const row = await prisma.branch_usage.findFirst({
    where: {
      branch_id: branchId,
      billing_cycle_start: { lte: today },
      billing_cycle_end: { gte: today },
    },
    orderBy: { billing_cycle_start: "desc" },
  });
  return row ? mapBranchUsage(row) : null;
}

export async function saasGetPharmacySubscriptionSummary(
  pharmacyId: string,
): Promise<PharmacySubscriptionSummary> {
  const [subscriptions, branches, capacity] = await Promise.all([
    saasGetPharmacySubscriptions(pharmacyId),
    saasGetPharmacyBranches(pharmacyId),
    getBranchCapacityFromDb(pharmacyId),
  ]);

  const mainSub =
    subscriptions.find((s) => s.subscription_type === "main") ?? null;
  const branchSubs = subscriptions.filter(
    (s) => s.subscription_type === "branch_addon",
  );

  const branchesWithUsage = await Promise.all(
    branches.map(async (b) => ({
      ...b,
      usage: await saasGetBranchCurrentUsage(b.id),
    })),
  );

  const totalMonthlyCost = subscriptions.reduce((sum, s) => {
    const price = s.plan?.price ?? 0;
    return sum + Number(price);
  }, 0);

  return {
    pharmacy_id: pharmacyId,
    main_subscription: mainSub,
    branch_subscriptions: branchSubs,
    branches: branchesWithUsage,
    total_monthly_cost: totalMonthlyCost,
    branch_limit: capacity.totalSlots,
    branch_count: capacity.branchCount,
    can_add_branch: capacity.canAddBranch,
    main_plan_branch_slots: capacity.mainPlanSlots,
    addon_subscription_count: capacity.addonSlots,
  };
}

export async function saasActivateSubscription(
  params: ActivateSubscriptionParams,
): Promise<Subscription> {
  const plan = await saasGetPlanById(params.plan_id);
  if (!plan) throw new Error("Plan not found");
  if (!plan.is_active) throw new Error("Plan is not available");

  const orch = createSubscriptionOrchestrator();
  let subscriptionId: string;

  if (params.subscription_type === "main") {
    const price = Number(plan.price ?? 0);
    if (price > 0) {
      const pending = await orch.beginPaidPlanChange(
        params.pharmacy_id,
        params.plan_id,
      );
      subscriptionId = pending.subscriptionId;
    } else {
      const free = await orch.activateFreePlan(
        params.pharmacy_id,
        params.plan_id,
      );
      subscriptionId = free.subscriptionId;
    }
  } else {
    if (!params.branch_id) {
      throw new Error("branch_id is required for branch_addon subscriptions");
    }
    const price = Number(plan.price ?? 0);
    if (price > 0) {
      const pending = await orch.beginPaidBranchAddon(
        params.pharmacy_id,
        params.plan_id,
        { branchId: params.branch_id },
      );
      subscriptionId = pending.subscriptionId;
    } else {
      throw new Error(
        "Free branch add-ons are not supported via this path. Use POST /api/subscriptions/branch-addon.",
      );
    }
  }

  const subscription = await fetchSubscriptionWithPlan(subscriptionId);
  if (!subscription) {
    throw new Error("activateSubscription: subscription not found");
  }
  return subscription;
}

export async function saasCancelSubscription(
  subscriptionId: string,
  pharmacyId: string,
): Promise<void> {
  await createSubscriptionOrchestrator().cancelSubscription(
    subscriptionId,
    pharmacyId,
  );
}

export async function saasCheckBranchCanTransact(branchId: string) {
  return rpcCheckBranchCanTransact(branchId);
}

export async function saasIncrementBranchTx(branchId: string) {
  return rpcIncrementBranchTx(branchId);
}

export async function saasCreateBranch(
  pharmacyId: string,
  data: { name: string; address?: string; phone?: string; email?: string },
): Promise<Branch> {
  const mainSub = await saasGetPharmacyMainSubscription(pharmacyId);
  if (!mainSub) {
    throw new Error("No active subscription. Please subscribe first.");
  }

  const plan = mainSub.plan;
  if (!plan) throw new Error("Subscription plan not found.");

  const capacity = await getBranchCapacityFromDb(pharmacyId);
  if (!capacity.canAddBranch) {
    throw new Error(
      `Branch limit reached (${capacity.totalSlots} allowed). Purchase a branch add-on or upgrade your main plan.`,
    );
  }
  if (capacity.needsAddonForNewBranch) {
    throw new Error(
      `Included branch slots are full (${capacity.mainPlanSlots}). Purchase a branch add-on before adding another branch.`,
    );
  }

  const created = await storeCreatePharmacyBranch({
    pharmacyId,
    name: data.name,
    address: data.address ?? null,
    phone: data.phone ?? null,
    email: data.email ?? null,
  });

  await provisionBranchUsageForBranch({
    branchId: created.id,
    pharmacyId,
    subscriptionId: mainSub.id,
    planId: plan.id,
  });

  const row = await prisma.branches.findUnique({ where: { id: created.id } });
  if (!row) throw new Error("createBranch: branch not found");
  return mapBranch(row);
}

export async function saasListSubscriptionInvoices(input: {
  pharmacyId: string;
  month?: string;
}) {
  const rows = await prisma.subscription_invoices.findMany({
    where: {
      pharmacy_id: input.pharmacyId,
      ...(input.month ? { billing_month: input.month } : {}),
    },
    orderBy: { billing_month: "desc" },
    include: { subscription_invoice_lines: true },
  });

  return rows.map((row) => ({
    ...mapInvoice(row),
    lines: row.subscription_invoice_lines.map((line) => ({
      id: line.id,
      invoice_id: line.invoice_id,
      subscription_id: line.subscription_id,
      branch_id: line.branch_id,
      description: line.description,
      amount: Number(line.amount),
      created_at: iso(line.created_at),
    })),
  }));
}

export async function saasGenerateMonthlyInvoice(
  pharmacyId: string,
  billingMonth?: string,
): Promise<SubscriptionInvoice> {
  const month = billingMonth ?? new Date().toISOString().slice(0, 7);

  const existing = await prisma.subscription_invoices.findFirst({
    where: { pharmacy_id: pharmacyId, billing_month: month },
  });
  if (existing) return mapInvoice(existing);

  const subscriptions = await saasGetPharmacySubscriptions(pharmacyId);
  const activeSubscriptions = subscriptions.filter((s) => s.status === "active");
  if (activeSubscriptions.length === 0) {
    throw new Error("No active subscriptions to invoice.");
  }

  const lines = activeSubscriptions.map((s) => {
    const plan = s.plan;
    const price = Number(plan?.price ?? 0);
    const label =
      s.subscription_type === "main"
        ? `${plan?.name ?? "Plan"} — Main subscription`
        : `${plan?.name ?? "Branch Add-on"} — Branch subscription`;
    return {
      subscription_id: s.id,
      branch_id: s.branch_id,
      description: label,
      amount: price,
    };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.amount, 0);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  const invoice = await prisma.subscription_invoices.create({
    data: {
      pharmacy_id: pharmacyId,
      invoice_number: invoiceNumber(),
      billing_month: month,
      subtotal,
      total: subtotal,
      status: "pending",
      due_date: dueDate,
      subscription_invoice_lines: {
        create: lines.map((line) => ({
          subscription_id: line.subscription_id,
          branch_id: line.branch_id,
          description: line.description,
          amount: line.amount,
        })),
      },
    },
  });

  return mapInvoice(invoice);
}

export async function saasGetAllSubscriptions(opts?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;

  const rows = await prisma.subscriptions.findMany({
    where: opts?.status ? { status: opts.status } : undefined,
    orderBy: { created_at: "desc" },
    take: limit,
    skip: offset,
    include: {
      subscription_plans_subscriptions_plan_idTosubscription_plans: {
        select: { id: true, name: true, price: true, plan_type: true },
      },
      pharmacies: { select: { id: true, name: true, owner_id: true } },
    },
  });

  return rows.map((row) => ({
    ...row,
    plan: row.subscription_plans_subscriptions_plan_idTosubscription_plans
      ? {
          ...row.subscription_plans_subscriptions_plan_idTosubscription_plans,
          price: Number(
            row.subscription_plans_subscriptions_plan_idTosubscription_plans
              .price ?? 0,
          ),
        }
      : null,
    pharmacy: row.pharmacies,
    created_at: iso(row.created_at),
    updated_at: iso(row.updated_at),
  }));
}
