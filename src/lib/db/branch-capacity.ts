import { prisma } from "@/lib/db/prisma";
import {
  isBranchAddonCatalogName,
  isMainTierCatalogRow,
} from "@/lib/subscription/normalize-plan";
import { normalizeLifecycleStatus } from "@/lib/subscription/lifecycle/status";
import type { BranchCapacity } from "@/lib/subscription/branch-addon-capacity";

const DEFAULT_MAIN_BRANCH_SLOTS = 1;

async function loadMainPlanBranchSlots(pharmacyId: string): Promise<number> {
  const rows = await prisma.subscriptions.findMany({
    where: {
      pharmacy_id: pharmacyId,
      subscription_type: "main",
    },
    orderBy: { created_at: "desc" },
    take: 8,
    include: {
      subscription_plans_subscriptions_plan_idTosubscription_plans: {
        select: {
          max_branches: true,
          plan_type: true,
          name: true,
        },
      },
    },
  });

  for (const row of rows) {
    const embedded =
      row.subscription_plans_subscriptions_plan_idTosubscription_plans;
    if (!embedded || !isMainTierCatalogRow(embedded)) continue;
    if (isBranchAddonCatalogName(embedded.name)) continue;

    const lifecycle = normalizeLifecycleStatus(row.status, {
      is_active: row.is_active,
      payment_method: row.payment_method,
      pending_change_status: row.pending_change_status,
    });
    if (
      lifecycle !== "active" &&
      lifecycle !== "pending_payment" &&
      lifecycle !== "scheduled_change"
    ) {
      continue;
    }

    return Number(embedded.max_branches ?? DEFAULT_MAIN_BRANCH_SLOTS);
  }

  return DEFAULT_MAIN_BRANCH_SLOTS;
}

async function countBranchAddonSlots(pharmacyId: string): Promise<number> {
  const rows = await prisma.subscriptions.findMany({
    where: {
      pharmacy_id: pharmacyId,
      subscription_type: "branch_addon",
    },
    select: {
      status: true,
      is_active: true,
      payment_method: true,
    },
  });

  return rows.filter((row) => {
    const status = normalizeLifecycleStatus(row.status, {
      is_active: row.is_active,
      payment_method: row.payment_method,
    });
    return status === "active" || status === "pending_payment";
  }).length;
}

export async function branchHasAddonSubscriptionFromDb(
  pharmacyId: string,
  branchId: string,
): Promise<boolean> {
  const rows = await prisma.subscriptions.findMany({
    where: {
      pharmacy_id: pharmacyId,
      branch_id: branchId,
      subscription_type: "branch_addon",
    },
    select: {
      status: true,
      is_active: true,
      payment_method: true,
    },
  });

  return rows.some((row) => {
    const status = normalizeLifecycleStatus(row.status, {
      is_active: row.is_active,
      payment_method: row.payment_method,
    });
    return status === "active" || status === "pending_payment";
  });
}

export async function getBranchCapacityFromDb(
  pharmacyId: string,
): Promise<BranchCapacity> {
  const [mainPlanSlots, branchCount, addonSlots] = await Promise.all([
    loadMainPlanBranchSlots(pharmacyId),
    prisma.branches.count({
      where: { pharmacy_id: pharmacyId, is_active: true },
    }),
    countBranchAddonSlots(pharmacyId),
  ]);

  const totalSlots = mainPlanSlots + addonSlots;

  return {
    pharmacyId,
    branchCount,
    mainPlanSlots,
    addonSlots,
    totalSlots,
    canAddBranch: branchCount < totalSlots,
    needsAddonForNewBranch:
      branchCount >= mainPlanSlots && branchCount >= totalSlots,
  };
}
