import {
  activatePendingSubscriptionFromDb,
  cancelPendingBranchAddonSubscriptionsFromDb,
  cancelPendingMainSubscriptionsFromDb,
  clearAppliedScheduleMetadataFromDb,
  clearSubscriptionScheduleFieldsFromDb,
  createActiveFreeMainSubscriptionFromDb,
  createActiveMainSubscriptionFromDb,
  createPendingBranchAddonSubscriptionFromDb,
  createPendingMainSubscriptionFromDb,
  cancelMainSubscriptionFromDb,
  createPharmacyBranchFromDb,
  deactivateOtherMainSubscriptionsFromDb,
  findPharmacyBranchFromDb,
  getMainSubscriptionRowFromDb,
  getSubscriptionByIdFromDb,
  listDueScheduledDowngradeRowsFromDb,
  listExpiredMainSubscriptionsFromDb,
  markSubscriptionCancelledAppliedFromDb,
  markSubscriptionExpiredFromDb,
  scheduleMainSubscriptionDowngradeFromDb,
  type DueScheduledDowngradeRow,
  type ExpiredMainSubscriptionRow,
  type MainSubscriptionOrchestratorRow,
  type SubscriptionActivationRow,
} from "@/lib/db/subscription-writes";

export type {
  DueScheduledDowngradeRow,
  ExpiredMainSubscriptionRow,
  MainSubscriptionOrchestratorRow,
  SubscriptionActivationRow,
};

export async function storeGetMainSubscriptionRow(
  pharmacyId: string,
): Promise<MainSubscriptionOrchestratorRow | null> {
  return getMainSubscriptionRowFromDb(pharmacyId);
}

export async function storeCancelPendingMainSubscriptions(
  pharmacyId: string,
): Promise<void> {
  return cancelPendingMainSubscriptionsFromDb(pharmacyId);
}

export async function storeCreatePendingMainSubscription(input: {
  pharmacyId: string;
  planId: string;
  planName: string;
}): Promise<string> {
  return createPendingMainSubscriptionFromDb(input);
}

export async function storeCreateActiveFreeMainSubscription(input: {
  pharmacyId: string;
  planId: string;
  planName: string;
  expiresAt: Date;
  periodStart: Date;
}): Promise<string> {
  return createActiveFreeMainSubscriptionFromDb(input);
}

export async function storeDeactivateOtherMainSubscriptions(
  pharmacyId: string,
  exceptId: string,
): Promise<void> {
  return deactivateOtherMainSubscriptionsFromDb(pharmacyId, exceptId);
}

export async function storeClearSubscriptionScheduleFields(
  subscriptionId: string,
): Promise<void> {
  return clearSubscriptionScheduleFieldsFromDb(subscriptionId);
}

export async function storeScheduleMainSubscriptionDowngrade(input: {
  subscriptionId: string;
  targetPlanId: string;
  effectiveAt: string;
}): Promise<void> {
  return scheduleMainSubscriptionDowngradeFromDb(input);
}

export async function storeListDueScheduledDowngradeRows(): Promise<
  DueScheduledDowngradeRow[]
> {
  return listDueScheduledDowngradeRowsFromDb();
}

export async function storeMarkSubscriptionCancelledApplied(
  subscriptionId: string,
): Promise<void> {
  return markSubscriptionCancelledAppliedFromDb(subscriptionId);
}

export async function storeClearAppliedScheduleMetadata(
  subscriptionId: string,
): Promise<void> {
  return clearAppliedScheduleMetadataFromDb(subscriptionId);
}

export async function storeCreateActiveMainSubscription(input: {
  pharmacyId: string;
  planId: string;
  planName: string;
  expiresAt: Date;
  periodStart: Date;
  paymentMethod: string;
  paymentReference?: string | null;
}): Promise<string> {
  return createActiveMainSubscriptionFromDb(input);
}

export async function storeGetSubscriptionById(
  subscriptionId: string,
): Promise<SubscriptionActivationRow | null> {
  return getSubscriptionByIdFromDb(subscriptionId);
}

export async function storeActivatePendingSubscription(input: {
  subscriptionId: string;
  planName: string;
  expiresAt: Date;
  periodStart: Date;
  paymentMethod: string;
  paymentReference?: string | null;
}): Promise<void> {
  return activatePendingSubscriptionFromDb(input);
}

export async function storeCancelPendingBranchAddonSubscriptions(input: {
  pharmacyId: string;
  branchId: string;
}): Promise<void> {
  return cancelPendingBranchAddonSubscriptionsFromDb(input);
}

export async function storeCreatePendingBranchAddonSubscription(input: {
  pharmacyId: string;
  planId: string;
  planName: string;
  branchId: string;
}): Promise<string> {
  return createPendingBranchAddonSubscriptionFromDb(input);
}

export async function storeFindPharmacyBranch(input: {
  pharmacyId: string;
  branchId: string;
}): Promise<{ id: string; name: string } | null> {
  return findPharmacyBranchFromDb(input);
}

export async function storeCreatePharmacyBranch(input: {
  pharmacyId: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}): Promise<{ id: string; name: string }> {
  return createPharmacyBranchFromDb(input);
}

export async function storeCancelMainSubscription(input: {
  subscriptionId: string;
  pharmacyId: string;
}): Promise<void> {
  return cancelMainSubscriptionFromDb(input);
}

export async function storeListExpiredMainSubscriptions(): Promise<
  ExpiredMainSubscriptionRow[]
> {
  return listExpiredMainSubscriptionsFromDb();
}

export async function storeMarkSubscriptionExpired(
  subscriptionId: string,
): Promise<void> {
  return markSubscriptionExpiredFromDb(subscriptionId);
}
