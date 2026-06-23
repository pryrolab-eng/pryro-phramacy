import { prisma } from "@/lib/db/prisma";
import { rpcProvisionBranchUsage } from "@/lib/db/saas-rpc";

const DEFAULT_TX_LIMIT = 500;

async function loadPlanTxLimit(planId: string): Promise<number> {
  const plan = await prisma.subscription_plans.findUnique({
    where: { id: planId },
    select: { monthly_tx_limit: true },
  });
  return Number(plan?.monthly_tx_limit ?? DEFAULT_TX_LIMIT);
}

/**
 * Creates or updates branch_usage rows for all active branches under a main subscription.
 * Safe to call repeatedly (RPC uses ON CONFLICT DO UPDATE).
 */
export async function provisionBranchUsageForMainSubscription(params: {
  pharmacyId: string;
  subscriptionId: string;
  planId: string | null;
}): Promise<void> {
  const { pharmacyId, subscriptionId, planId } = params;
  if (!planId) return;

  const txLimit = await loadPlanTxLimit(planId);

  const branches = await prisma.branches.findMany({
    where: { pharmacy_id: pharmacyId, is_active: true },
    select: { id: true },
  });

  if (!branches.length) return;

  await Promise.all(
    branches.map((b) =>
      rpcProvisionBranchUsage({
        branchId: b.id,
        pharmacyId,
        subscriptionId,
        txLimit,
      }).catch((error) => {
        console.error("provisionBranchUsageForMainSubscription: rpc", error);
      }),
    ),
  );
}

/** Provisions usage for a single branch (branch_addon subscriptions). */
export async function provisionBranchUsageForBranch(params: {
  branchId: string;
  pharmacyId: string;
  subscriptionId: string;
  planId: string;
}): Promise<void> {
  const txLimit = await loadPlanTxLimit(params.planId);
  try {
    await rpcProvisionBranchUsage({
      branchId: params.branchId,
      pharmacyId: params.pharmacyId,
      subscriptionId: params.subscriptionId,
      txLimit,
    });
  } catch (error) {
    console.error("provisionBranchUsageForBranch: rpc", error);
  }
}
