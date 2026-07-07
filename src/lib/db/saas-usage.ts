import { prisma } from "@/lib/db/prisma";
import type { TransactionCheckResult } from "@/lib/saas/types";

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

export function isMissingSaasRpcError(err: unknown): boolean {
  const msg =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : String(err);
  return (
    msg.includes("42883") ||
    msg.includes("check_branch_can_transact") ||
    msg.includes("increment_branch_tx") ||
    msg.includes("provision_branch_usage") ||
    msg.includes("reset_monthly_branch_usage")
  );
}

async function findCurrentUsage(branchId: string) {
  const today = new Date();
  return prisma.branch_usage.findFirst({
    where: {
      branch_id: branchId,
      billing_cycle_start: { lte: today },
      billing_cycle_end: { gte: today },
    },
    orderBy: { billing_cycle_start: "desc" },
  });
}

/** Ensures a branch_usage row exists when the pharmacy has an active main subscription. */
export async function ensureBranchUsageRecord(branchId: string) {
  const existing = await findCurrentUsage(branchId);
  if (existing) return existing;

  const branch = await prisma.branches.findUnique({
    where: { id: branchId },
    select: { pharmacy_id: true },
  });
  if (!branch?.pharmacy_id) return null;

  const subscription = await prisma.subscriptions.findFirst({
    where: {
      pharmacy_id: branch.pharmacy_id,
      subscription_type: "main",
      status: "active",
    },
    orderBy: { created_at: "desc" },
    include: {
      subscription_plans_subscriptions_plan_idTosubscription_plans: {
        select: { monthly_tx_limit: true },
      },
    },
  });
  if (!subscription) return null;

  const today = new Date();
  const cycleStart = startOfMonth(today);
  const cycleEnd = endOfMonth(today);
  const txLimit = Number(
    subscription.subscription_plans_subscriptions_plan_idTosubscription_plans
      ?.monthly_tx_limit ?? 500,
  );

  const prior = await prisma.branch_usage.findFirst({
    where: {
      branch_id: branchId,
      billing_cycle_start: cycleStart,
    },
  });
  if (prior) return prior;

  return prisma.branch_usage.create({
    data: {
      branch_id: branchId,
      pharmacy_id: branch.pharmacy_id,
      subscription_id: subscription.id,
      billing_cycle_start: cycleStart,
      billing_cycle_end: cycleEnd,
      tx_count: 0,
      tx_limit: txLimit,
      is_blocked: false,
    },
  });
}

export async function checkBranchCanTransactFromDb(
  branchId: string,
): Promise<TransactionCheckResult> {
  let usage = await findCurrentUsage(branchId);
  if (!usage) {
    usage = await ensureBranchUsageRecord(branchId);
  }

  if (!usage) {
    return {
      allowed: false,
      reason: "no_subscription",
      message: "This branch has no active subscription.",
    };
  }

  if (usage.is_blocked || usage.tx_count >= usage.tx_limit) {
    return {
      allowed: false,
      reason: "limit_reached",
      tx_count: usage.tx_count,
      tx_limit: usage.tx_limit,
      message: `Transaction limit reached (${usage.tx_count.toLocaleString()} / ${usage.tx_limit.toLocaleString()} this month). Upgrade your plan or wait for the billing cycle to reset.`,
    };
  }

  return {
    allowed: true,
    tx_count: usage.tx_count,
    tx_limit: usage.tx_limit,
    remaining: usage.tx_limit - usage.tx_count,
  };
}

export async function incrementBranchTxFromDb(branchId: string): Promise<{
  ok: boolean;
  tx_count?: number;
  tx_limit?: number;
  remaining?: number;
  blocked?: boolean;
  reason?: string;
}> {
  let usage = await findCurrentUsage(branchId);
  if (!usage) {
    usage = await ensureBranchUsageRecord(branchId);
  }
  if (!usage) {
    return { ok: false, reason: "no_usage_record" };
  }

  const newCount = usage.tx_count + 1;
  const blocked = newCount >= usage.tx_limit;

  await prisma.branch_usage.update({
    where: { id: usage.id },
    data: {
      tx_count: newCount,
      is_blocked: blocked,
      updated_at: new Date(),
    },
  });

  return {
    ok: true,
    tx_count: newCount,
    tx_limit: usage.tx_limit,
    remaining: usage.tx_limit - newCount,
    blocked,
  };
}

export async function provisionBranchUsageFromDb(input: {
  branchId: string;
  pharmacyId: string;
  subscriptionId: string;
  txLimit: number;
  periodStart?: Date;
}): Promise<void> {
  const periodStart = input.periodStart ?? new Date();
  const cycleStart = startOfMonth(periodStart);
  const cycleEnd = endOfMonth(periodStart);

  const existing = await prisma.branch_usage.findFirst({
    where: {
      branch_id: input.branchId,
      billing_cycle_start: cycleStart,
    },
  });

  if (existing) {
    await prisma.branch_usage.update({
      where: { id: existing.id },
      data: {
        tx_limit: input.txLimit,
        subscription_id: input.subscriptionId,
        is_blocked: false,
        updated_at: new Date(),
      },
    });
    return;
  }

  await prisma.branch_usage.create({
    data: {
      branch_id: input.branchId,
      pharmacy_id: input.pharmacyId,
      subscription_id: input.subscriptionId,
      billing_cycle_start: cycleStart,
      billing_cycle_end: cycleEnd,
      tx_count: 0,
      tx_limit: input.txLimit,
      is_blocked: false,
    },
  });
}
