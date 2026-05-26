import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isBranchAddonCatalogName,
  isMainTierCatalogRow,
} from "./normalize-plan";
import { normalizeLifecycleStatus } from "./lifecycle/status";

export type BranchCapacity = {
  pharmacyId: string;
  branchCount: number;
  /** Slots included in the main plan */
  mainPlanSlots: number;
  /** Active or pending branch add-on subscriptions */
  addonSlots: number;
  /** mainPlanSlots + addonSlots */
  totalSlots: number;
  canAddBranch: boolean;
  /** All slots used — need a new add-on purchase to create another branch */
  needsAddonForNewBranch: boolean;
};

const DEFAULT_MAIN_BRANCH_SLOTS = 1;

/** Main-plan branch slots only — must not call resolvePharmacyEntitlements (avoids cycle). */
async function loadMainPlanBranchSlots(
  admin: SupabaseClient,
  pharmacyId: string,
): Promise<number> {
  const { data: rows, error } = await admin
    .from("subscriptions")
    .select(
      "status, is_active, payment_method, pending_change_status, subscription_plans!plan_id(max_branches, plan_type, name)",
    )
    .eq("pharmacy_id", pharmacyId)
    .eq("subscription_type", "main")
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) throw new Error(error.message);

  for (const row of rows ?? []) {
    const embedded = (row as {
      subscription_plans?: {
        max_branches?: number;
        plan_type?: string;
        name?: string;
      } | null;
    }).subscription_plans;
    if (!embedded || !isMainTierCatalogRow(embedded)) continue;
    if (isBranchAddonCatalogName(embedded.name)) continue;

    const lifecycle = normalizeLifecycleStatus(
      (row as { status?: string }).status,
      {
        is_active: (row as { is_active?: boolean }).is_active,
        payment_method: (row as { payment_method?: string }).payment_method,
        pending_change_status: (row as { pending_change_status?: string })
          .pending_change_status,
      },
    );
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

async function countBranchAddonSlots(
  admin: SupabaseClient,
  pharmacyId: string,
): Promise<number> {
  const { data: addonRows, error: addonErr } = await admin
    .from("subscriptions")
    .select("status, is_active, payment_method")
    .eq("pharmacy_id", pharmacyId)
    .eq("subscription_type", "branch_addon");

  if (addonErr) throw new Error(addonErr.message);

  return (addonRows ?? []).filter((row) => {
    const status = normalizeLifecycleStatus(row.status, {
      is_active: row.is_active,
      payment_method: row.payment_method,
    });
    return status === "active" || status === "pending_payment";
  }).length;
}

export async function getBranchCapacity(
  admin: SupabaseClient,
  pharmacyId: string,
): Promise<BranchCapacity> {
  const [mainPlanSlots, branchCount, addonSlots] = await Promise.all([
    loadMainPlanBranchSlots(admin, pharmacyId),
    admin
      .from("branches")
      .select("id", { count: "exact", head: true })
      .eq("pharmacy_id", pharmacyId)
      .eq("is_active", true)
      .then(({ count, error: branchErr }) => {
        if (branchErr) throw new Error(branchErr.message);
        return count ?? 0;
      }),
    countBranchAddonSlots(admin, pharmacyId),
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

/** True if this branch already has an active or pending branch add-on subscription. */
export async function branchHasAddonSubscription(
  admin: SupabaseClient,
  pharmacyId: string,
  branchId: string,
): Promise<boolean> {
  const { data: rows } = await admin
    .from("subscriptions")
    .select("status, is_active, payment_method")
    .eq("pharmacy_id", pharmacyId)
    .eq("branch_id", branchId)
    .eq("subscription_type", "branch_addon");

  return (rows ?? []).some((row) => {
    const status = normalizeLifecycleStatus(row.status, {
      is_active: row.is_active,
      payment_method: row.payment_method,
    });
    return status === "active" || status === "pending_payment";
  });
}
