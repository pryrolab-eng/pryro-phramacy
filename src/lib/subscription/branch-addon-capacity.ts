import type { SupabaseClient } from "@supabase/supabase-js";
import { resolvePharmacyEntitlements } from "./lifecycle/entitlements";
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

export async function getBranchCapacity(
  admin: SupabaseClient,
  pharmacyId: string
): Promise<BranchCapacity> {
  const ent = await resolvePharmacyEntitlements(admin, pharmacyId);
  const mainPlanSlots = ent.effectivePlan?.max_branches ?? 0;

  const { count: branchCount, error: branchErr } = await admin
    .from("branches")
    .select("id", { count: "exact", head: true })
    .eq("pharmacy_id", pharmacyId)
    .eq("is_active", true);

  if (branchErr) throw new Error(branchErr.message);

  const { data: addonRows, error: addonErr } = await admin
    .from("subscriptions")
    .select("status, is_active, payment_method")
    .eq("pharmacy_id", pharmacyId)
    .eq("subscription_type", "branch_addon");

  if (addonErr) throw new Error(addonErr.message);

  const addonSlots = (addonRows ?? []).filter((row) => {
    const status = normalizeLifecycleStatus(row.status, {
      is_active: row.is_active,
      payment_method: row.payment_method,
    });
    return status === "active" || status === "pending_payment";
  }).length;

  const count = branchCount ?? 0;
  const totalSlots = mainPlanSlots + addonSlots;

  return {
    pharmacyId,
    branchCount: count,
    mainPlanSlots,
    addonSlots,
    totalSlots,
    canAddBranch: count < totalSlots,
    needsAddonForNewBranch: count >= mainPlanSlots && count >= totalSlots,
  };
}

/** True if this branch already has an active or pending branch add-on subscription. */
export async function branchHasAddonSubscription(
  admin: SupabaseClient,
  pharmacyId: string,
  branchId: string
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
