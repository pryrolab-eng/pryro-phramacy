import type { subscription_plan } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { planNameToEnum } from "@/lib/subscription/plan-enum";

const PENDING_MAIN_STATUSES = ["pending_payment", "pending"] as const;
const ACTIVE_MAIN_STATUSES = [
  "active",
  "scheduled_change",
  "pending_payment",
  "pending",
] as const;

export type MainSubscriptionOrchestratorRow = {
  id: string;
  pharmacy_id: string | null;
  plan_id: string | null;
  plan: string | null;
  status: string;
  is_active: boolean | null;
  expires_at: string | null;
  payment_method: string | null;
  next_plan_id: string | null;
  change_scheduled_at: string | null;
  change_type: string | null;
  pending_change_status: string | null;
  subscription_plans:
    | { id: string; name: string; price: number; period: string }
    | null;
};

export async function getMainSubscriptionRowFromDb(
  pharmacyId: string,
): Promise<MainSubscriptionOrchestratorRow | null> {
  const row = await prisma.subscriptions.findFirst({
    where: {
      pharmacy_id: pharmacyId,
      subscription_type: "main",
      status: { in: [...ACTIVE_MAIN_STATUSES] },
    },
    orderBy: { created_at: "desc" },
    include: {
      subscription_plans_subscriptions_plan_idTosubscription_plans: {
        select: { id: true, name: true, price: true, period: true },
      },
    },
  });

  if (!row) return null;

  const plan =
    row.subscription_plans_subscriptions_plan_idTosubscription_plans;

  return {
    id: row.id,
    pharmacy_id: row.pharmacy_id,
    plan_id: row.plan_id,
    plan: row.plan != null ? String(row.plan) : null,
    status: row.status,
    is_active: row.is_active,
    expires_at: row.expires_at?.toISOString() ?? null,
    payment_method: row.payment_method,
    next_plan_id: row.next_plan_id,
    change_scheduled_at: row.change_scheduled_at?.toISOString() ?? null,
    change_type: row.change_type,
    pending_change_status: row.pending_change_status,
    subscription_plans: plan
      ? {
          id: plan.id,
          name: plan.name,
          price: Number(plan.price),
          period: plan.period,
        }
      : null,
  };
}

export async function cancelPendingMainSubscriptionsFromDb(
  pharmacyId: string,
): Promise<void> {
  await prisma.subscriptions.updateMany({
    where: {
      pharmacy_id: pharmacyId,
      subscription_type: "main",
      status: { in: [...PENDING_MAIN_STATUSES] },
    },
    data: {
      status: "cancelled",
      is_active: false,
      payment_method: "cancelled",
    },
  });
}

export async function createPendingMainSubscriptionFromDb(input: {
  pharmacyId: string;
  planId: string;
  planName: string;
}): Promise<string> {
  const planEnum = planNameToEnum(input.planName) as subscription_plan;

  const row = await prisma.subscriptions.create({
    data: {
      pharmacy_id: input.pharmacyId,
      plan_id: input.planId,
      plan: planEnum,
      subscription_type: "main",
      status: "pending_payment",
      is_active: false,
      expires_at: null,
      current_period_start: null,
      current_period_end: null,
      payment_method: "pending",
    },
    select: { id: true },
  });

  return row.id;
}

export async function createActiveMainSubscriptionFromDb(input: {
  pharmacyId: string;
  planId: string;
  planName: string;
  expiresAt: Date;
  periodStart: Date;
  paymentMethod: string;
  paymentReference?: string | null;
}): Promise<string> {
  const planEnum = planNameToEnum(input.planName) as subscription_plan;

  const row = await prisma.subscriptions.create({
    data: {
      pharmacy_id: input.pharmacyId,
      plan_id: input.planId,
      plan: planEnum,
      subscription_type: "main",
      status: "active",
      is_active: true,
      expires_at: input.expiresAt,
      current_period_start: input.periodStart,
      current_period_end: input.expiresAt,
      payment_method: input.paymentMethod,
      payment_reference: input.paymentReference ?? null,
    },
    select: { id: true },
  });

  return row.id;
}

export async function createActiveFreeMainSubscriptionFromDb(input: {
  pharmacyId: string;
  planId: string;
  planName: string;
  expiresAt: Date;
  periodStart: Date;
}): Promise<string> {
  return createActiveMainSubscriptionFromDb({
    ...input,
    paymentMethod: "free",
  });
}

export async function deactivateOtherMainSubscriptionsFromDb(
  pharmacyId: string,
  exceptId: string,
): Promise<void> {
  await prisma.subscriptions.updateMany({
    where: {
      pharmacy_id: pharmacyId,
      subscription_type: "main",
      id: { not: exceptId },
      status: { in: [...ACTIVE_MAIN_STATUSES] },
    },
    data: {
      status: "cancelled",
      is_active: false,
      cancelled_at: new Date(),
    },
  });
}

export async function clearSubscriptionScheduleFieldsFromDb(
  subscriptionId: string,
): Promise<void> {
  await prisma.subscriptions.update({
    where: { id: subscriptionId },
    data: {
      next_plan_id: null,
      change_scheduled_at: null,
      change_type: null,
      pending_change_status: null,
      status: "active",
      is_active: true,
    },
  });
}

export async function scheduleMainSubscriptionDowngradeFromDb(input: {
  subscriptionId: string;
  targetPlanId: string;
  effectiveAt: string;
}): Promise<void> {
  await prisma.subscriptions.update({
    where: { id: input.subscriptionId },
    data: {
      next_plan_id: input.targetPlanId,
      change_scheduled_at: new Date(input.effectiveAt),
      change_type: "downgrade",
      pending_change_status: "scheduled",
      status: "scheduled_change",
      is_active: true,
    },
  });
}

export type DueScheduledDowngradeRow = {
  id: string;
  pharmacy_id: string;
  plan_id: string | null;
  plan: string | null;
  expires_at: string | null;
  next_plan_id: string;
  change_scheduled_at: string | null;
  pending_change_status: string | null;
  status: string;
};

export async function listDueScheduledDowngradeRowsFromDb(): Promise<
  DueScheduledDowngradeRow[]
> {
  const rows = await prisma.subscriptions.findMany({
    where: {
      subscription_type: "main",
      pending_change_status: "scheduled",
      next_plan_id: { not: null },
      change_scheduled_at: { lte: new Date() },
      status: { in: ["active", "scheduled_change"] },
    },
    select: {
      id: true,
      pharmacy_id: true,
      plan_id: true,
      plan: true,
      expires_at: true,
      next_plan_id: true,
      change_scheduled_at: true,
      pending_change_status: true,
      status: true,
    },
  });

  return rows
    .filter((row) => row.pharmacy_id && row.next_plan_id)
    .map((row) => ({
      id: row.id,
      pharmacy_id: row.pharmacy_id as string,
      plan_id: row.plan_id,
      plan: row.plan != null ? String(row.plan) : null,
      expires_at: row.expires_at?.toISOString() ?? null,
      next_plan_id: row.next_plan_id as string,
      change_scheduled_at: row.change_scheduled_at?.toISOString() ?? null,
      pending_change_status: row.pending_change_status,
      status: row.status,
    }));
}

export async function markSubscriptionCancelledAppliedFromDb(
  subscriptionId: string,
): Promise<void> {
  await prisma.subscriptions.update({
    where: { id: subscriptionId },
    data: {
      status: "cancelled",
      is_active: false,
      pending_change_status: "applied",
    },
  });
}

export async function clearAppliedScheduleMetadataFromDb(
  subscriptionId: string,
): Promise<void> {
  await prisma.subscriptions.update({
    where: { id: subscriptionId },
    data: {
      next_plan_id: null,
      change_scheduled_at: null,
      change_type: null,
      pending_change_status: null,
    },
  });
}

export type SubscriptionActivationRow = {
  id: string;
  pharmacy_id: string;
  plan_id: string | null;
  plan: string | null;
  status: string;
  expires_at: string | null;
  subscription_type: string;
  branch_id: string | null;
};

export async function getSubscriptionByIdFromDb(
  subscriptionId: string,
): Promise<SubscriptionActivationRow | null> {
  const row = await prisma.subscriptions.findUnique({
    where: { id: subscriptionId },
    select: {
      id: true,
      pharmacy_id: true,
      plan_id: true,
      plan: true,
      status: true,
      expires_at: true,
      subscription_type: true,
      branch_id: true,
    },
  });

  if (!row || !row.pharmacy_id) return null;

  return {
    id: row.id,
    pharmacy_id: row.pharmacy_id,
    plan_id: row.plan_id,
    plan: row.plan != null ? String(row.plan) : null,
    status: row.status,
    expires_at: row.expires_at?.toISOString() ?? null,
    subscription_type: row.subscription_type,
    branch_id: row.branch_id,
  };
}

export async function activatePendingSubscriptionFromDb(input: {
  subscriptionId: string;
  planName: string;
  expiresAt: Date;
  periodStart: Date;
  paymentMethod: string;
  paymentReference?: string | null;
}): Promise<void> {
  const planEnum = planNameToEnum(input.planName) as subscription_plan;

  await prisma.subscriptions.update({
    where: { id: input.subscriptionId },
    data: {
      status: "active",
      is_active: true,
      plan: planEnum,
      expires_at: input.expiresAt,
      current_period_start: input.periodStart,
      current_period_end: input.expiresAt,
      payment_method: input.paymentMethod,
      payment_reference: input.paymentReference ?? null,
    },
  });
}

export async function cancelPendingBranchAddonSubscriptionsFromDb(input: {
  pharmacyId: string;
  branchId: string;
}): Promise<void> {
  await prisma.subscriptions.updateMany({
    where: {
      pharmacy_id: input.pharmacyId,
      branch_id: input.branchId,
      subscription_type: "branch_addon",
      status: { in: [...PENDING_MAIN_STATUSES] },
    },
    data: {
      status: "cancelled",
      is_active: false,
      payment_method: "cancelled",
    },
  });
}

export async function createPendingBranchAddonSubscriptionFromDb(input: {
  pharmacyId: string;
  planId: string;
  planName: string;
  branchId: string;
}): Promise<string> {
  const planEnum = planNameToEnum(input.planName) as subscription_plan;

  const row = await prisma.subscriptions.create({
    data: {
      pharmacy_id: input.pharmacyId,
      plan_id: input.planId,
      branch_id: input.branchId,
      plan: planEnum,
      subscription_type: "branch_addon",
      status: "pending_payment",
      is_active: false,
      expires_at: null,
      payment_method: "pending",
    },
    select: { id: true },
  });

  return row.id;
}

export async function findPharmacyBranchFromDb(input: {
  pharmacyId: string;
  branchId: string;
}): Promise<{ id: string; name: string } | null> {
  const row = await prisma.branches.findFirst({
    where: {
      id: input.branchId,
      pharmacy_id: input.pharmacyId,
    },
    select: { id: true, name: true },
  });
  return row;
}

export async function cancelMainSubscriptionFromDb(input: {
  subscriptionId: string;
  pharmacyId: string;
}): Promise<void> {
  await prisma.subscriptions.updateMany({
    where: {
      id: input.subscriptionId,
      pharmacy_id: input.pharmacyId,
    },
    data: {
      status: "cancelled",
      is_active: false,
      cancelled_at: new Date(),
      next_plan_id: null,
      change_scheduled_at: null,
      change_type: null,
      pending_change_status: null,
    },
  });
}

export type ExpiredMainSubscriptionRow = {
  id: string;
  pharmacy_id: string;
};

export async function listExpiredMainSubscriptionsFromDb(): Promise<
  ExpiredMainSubscriptionRow[]
> {
  const rows = await prisma.subscriptions.findMany({
    where: {
      subscription_type: "main",
      status: { in: ["active", "scheduled_change"] },
      expires_at: { lt: new Date() },
    },
    select: {
      id: true,
      pharmacy_id: true,
    },
  });

  return rows
    .filter((row) => row.pharmacy_id)
    .map((row) => ({
      id: row.id,
      pharmacy_id: row.pharmacy_id as string,
    }));
}

export async function markSubscriptionExpiredFromDb(
  subscriptionId: string,
): Promise<void> {
  await prisma.subscriptions.update({
    where: { id: subscriptionId },
    data: {
      status: "expired",
      is_active: false,
    },
  });
}

export async function createPharmacyBranchFromDb(input: {
  pharmacyId: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}): Promise<{ id: string; name: string }> {
  const row = await prisma.branches.create({
    data: {
      pharmacy_id: input.pharmacyId,
      name: input.name,
      address: input.address ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      is_active: true,
    },
    select: { id: true, name: true },
  });
  return row;
}
