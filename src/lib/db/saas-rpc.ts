import { prisma } from "@/lib/db/prisma";
import type { TransactionCheckResult } from "@/lib/saas/types";

type JsonRpcRow = { result: unknown };

function parseTransactionCheckResult(raw: unknown): TransactionCheckResult {
  const result = (raw ?? {}) as Record<string, unknown>;
  return {
    allowed: Boolean(result.allowed),
    reason: result.reason as TransactionCheckResult["reason"],
    tx_count:
      result.tx_count != null ? Number(result.tx_count) : undefined,
    tx_limit:
      result.tx_limit != null ? Number(result.tx_limit) : undefined,
    remaining:
      result.remaining != null ? Number(result.remaining) : undefined,
    message:
      typeof result.message === "string" ? result.message : undefined,
  };
}

export async function rpcCheckBranchCanTransact(
  branchId: string,
): Promise<TransactionCheckResult> {
  const rows = await prisma.$queryRaw<JsonRpcRow[]>`
    SELECT check_branch_can_transact(${branchId}::uuid) AS result
  `;
  return parseTransactionCheckResult(rows[0]?.result);
}

export async function rpcIncrementBranchTx(branchId: string): Promise<{
  ok: boolean;
  tx_count?: number;
  tx_limit?: number;
  remaining?: number;
  blocked?: boolean;
  reason?: string;
}> {
  const rows = await prisma.$queryRaw<JsonRpcRow[]>`
    SELECT increment_branch_tx(${branchId}::uuid) AS result
  `;
  const result = (rows[0]?.result ?? {}) as Record<string, unknown>;
  return {
    ok: Boolean(result.ok),
    tx_count: result.tx_count != null ? Number(result.tx_count) : undefined,
    tx_limit: result.tx_limit != null ? Number(result.tx_limit) : undefined,
    remaining:
      result.remaining != null ? Number(result.remaining) : undefined,
    blocked: result.blocked != null ? Boolean(result.blocked) : undefined,
    reason: typeof result.reason === "string" ? result.reason : undefined,
  };
}

export async function rpcProvisionBranchUsage(input: {
  branchId: string;
  pharmacyId: string;
  subscriptionId: string;
  txLimit: number;
}): Promise<void> {
  await prisma.$executeRaw`
    SELECT provision_branch_usage(
      ${input.branchId}::uuid,
      ${input.pharmacyId}::uuid,
      ${input.subscriptionId}::uuid,
      ${input.txLimit}::integer
    )
  `;
}

export async function rpcResetMonthlyBranchUsage(): Promise<number> {
  const rows = await prisma.$queryRaw<[{ reset_monthly_branch_usage: number }]>`
    SELECT reset_monthly_branch_usage() AS reset_monthly_branch_usage
  `;
  return Number(rows[0]?.reset_monthly_branch_usage ?? 0);
}
