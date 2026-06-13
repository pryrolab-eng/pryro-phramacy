import {
  branchHasAddonSubscriptionFromDb,
  getBranchCapacityFromDb,
} from "@/lib/db/branch-capacity";

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
  pharmacyId: string,
): Promise<BranchCapacity> {
  return getBranchCapacityFromDb(pharmacyId);
}

/** True if this branch already has an active or pending branch add-on subscription. */
export async function branchHasAddonSubscription(
  pharmacyId: string,
  branchId: string,
): Promise<boolean> {
  return branchHasAddonSubscriptionFromDb(pharmacyId, branchId);
}
