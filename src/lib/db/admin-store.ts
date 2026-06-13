import type { pharmacy_status, Prisma, subscription_plan } from "@prisma/client";
import type { AdminMainSubRow } from "@/lib/admin/pharmacy-list-enrichment";
import { listActiveCatalogPlansFromDb } from "@/lib/db/subscriptions";
import {
  cancelSubscriptionsByIdsFromDb,
  countActiveSubscribersByPlanIdFromDb,
  createBackupFromDb,
  createGlobalCategoryFromDb,
  createGlobalInsuranceTemplateFromDb,
  createPharmacyFromDb,
  createPlatformAdminReportFromDb,
  createPlatformApiKeyFromDb,
  createSubscriptionPlanFromDb,
  deleteGlobalCategoryFromDb,
  deleteGlobalInsuranceTemplateFromDb,
  deletePharmacyFromDb,
  findActiveBranchAddonCatalogFromDb,
  findPharmacyByIdFromDb,
  findSubscriptionPlanByIdFromDb,
  getPlatformAnalyticsFromDb,
  getSubscriptionPlanNameByIdFromDb,
  listActiveMainCatalogPlansFromDb,
  listActiveSubscriptionPlansForConflictFromDb,
  listAdminPaymentTransactionsFromDb,
  listAdminSubscriptionsFromDb,
  listAllSubscriptionPlansFromDb,
  listBackupsFromDb,
  listBranchAddonPharmacyIdsFromDb,
  listEnabledPlanFeaturesByPlanIdsFromDb,
  listGlobalCategoriesFromDb,
  listGlobalInsuranceTemplatesFromDb,
  listBranchAddonSubsForAdminPharmacyDetailFromDb,
  listMainSubsForAdminPharmacyDetailFromDb,
  listMainSubsForAdminPharmacyListFromDb,
  listPharmaciesForAdminFromDb,
  listPlatformApiKeysFromDb,
  listPlatformSystemSettingsFromDb,
  listSubscriptionsForPharmacyDeleteFromDb,
  searchPharmaciesFromDb,
  updateGlobalCategoryFromDb,
  updateGlobalInsuranceTemplateFromDb,
  updatePharmacyFromDb,
  updatePlatformApiKeyFromDb,
  updateSubscriptionPlanFromDb,
  upsertPlatformSystemSettingFromDb,
} from "@/lib/db/admin";

export async function storeListGlobalCategories() {
  return listGlobalCategoriesFromDb();
}

export async function storeCreateGlobalCategory(input: {
  name: string;
  description?: string;
}) {
  return createGlobalCategoryFromDb(input);
}

export async function storeUpdateGlobalCategory(
  id: string,
  input: { name?: string; description?: string; isActive?: boolean },
) {
  return updateGlobalCategoryFromDb(id, input);
}

export async function storeDeleteGlobalCategory(id: string) {
  return deleteGlobalCategoryFromDb(id);
}

export async function storeListPlatformApiKeys() {
  return listPlatformApiKeysFromDb();
}

export async function storeCreatePlatformApiKey(input: {
  name: string;
  key: string;
  createdBy: string;
  permissions?: string[];
}) {
  return createPlatformApiKeyFromDb({
    name: input.name,
    keyHash: input.key,
    keyPrefix: input.key.substring(0, 8),
    createdBy: input.createdBy,
    permissions: input.permissions,
  });
}

export async function storeUpdatePlatformApiKey(input: {
  id: string;
  name?: string;
  key?: string;
  isActive?: boolean;
  permissions?: string[];
}) {
  await updatePlatformApiKeyFromDb({
    id: input.id,
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.key !== undefined
      ? { keyHash: input.key, keyPrefix: input.key.substring(0, 8) }
      : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    ...(input.permissions !== undefined ? { permissions: input.permissions } : {}),
  });
}

export async function storeListGlobalInsuranceTemplates() {
  return listGlobalInsuranceTemplatesFromDb();
}

export async function storeCreateGlobalInsuranceTemplate(input: {
  name: string;
  insuranceProvider: string;
  templateHtml?: string;
  templateCss?: string;
}) {
  return createGlobalInsuranceTemplateFromDb(input);
}

export async function storeUpdateGlobalInsuranceTemplate(
  id: string,
  input: {
    name?: string;
    insuranceProvider?: string;
    templateHtml?: string;
    templateCss?: string;
    isActive?: boolean;
  },
) {
  return updateGlobalInsuranceTemplateFromDb(id, input);
}

export async function storeDeleteGlobalInsuranceTemplate(id: string) {
  return deleteGlobalInsuranceTemplateFromDb(id);
}

export async function storeGetPlatformSystemSettings() {
  const rows = await listPlatformSystemSettingsFromDb();
  const settings: Record<string, unknown> = {};
  rows.forEach((row) => {
    settings[row.setting_key] = row.setting_value;
  });
  const analytics = await getPlatformAnalyticsFromDb();
  return { settings, analytics };
}

export async function storeUpsertPlatformSystemSettings(
  updates: Record<string, unknown>,
) {
  for (const [key, value] of Object.entries(updates)) {
    await upsertPlatformSystemSettingFromDb({
      key,
      value: value as Prisma.InputJsonValue,
    });
  }
}

export async function storeSearchPharmacies(pattern: string) {
  return searchPharmaciesFromDb(pattern);
}

export async function storeListBackups() {
  return listBackupsFromDb();
}

export async function storeCreateBackup(input: {
  pharmacyId?: string | null;
  type: string;
  name?: string;
  fileSize?: string;
  filePath?: string | null;
  status?: string;
}) {
  const name =
    input.name ?? `${input.type} Backup - ${new Date().toLocaleDateString()}`;

  return createBackupFromDb({
    pharmacyId: input.pharmacyId,
    name,
    type: input.type,
    fileSize: input.fileSize,
    filePath: input.filePath,
    status: input.status,
  });
}

export async function storeListAdminTransactions() {
  const [transactions, subscriptions] = await Promise.all([
    listAdminPaymentTransactionsFromDb(),
    listAdminSubscriptionsFromDb(),
  ]);
  return { transactions, subscriptions };
}

export async function storeListPharmaciesForAdmin() {
  return listPharmaciesForAdminFromDb();
}

export async function storeListMainSubsForAdminPharmacyList(): Promise<
  AdminMainSubRow[]
> {
  return listMainSubsForAdminPharmacyListFromDb();
}

export async function storeListBranchAddonPharmacyIds(): Promise<string[]> {
  return listBranchAddonPharmacyIdsFromDb();
}

export async function storeListActiveMainCatalogPlans() {
  return listActiveMainCatalogPlansFromDb();
}

export async function storeListActiveCatalogPlans() {
  return listActiveCatalogPlansFromDb();
}

export async function storeFindPharmacyById(id: string) {
  return findPharmacyByIdFromDb(id);
}

export async function storeCreatePharmacy(input: {
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  licenseNumber: string;
  subscriptionPlan: subscription_plan;
  ownerId: string;
  status?: pharmacy_status;
}) {
  return createPharmacyFromDb(input);
}

export async function storeUpdatePharmacy(
  id: string,
  input: {
    name?: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    licenseNumber?: string;
    subscriptionPlan?: subscription_plan;
    status?: pharmacy_status;
  },
) {
  return updatePharmacyFromDb(id, input);
}

export async function storeDeletePharmacy(id: string) {
  await deletePharmacyFromDb(id);
}

export async function storeUpsertOwnerPublicUser(input: {
  userId: string;
  email: string;
  name: string;
}) {
  const { storeUpsertPublicUser } = await import("@/lib/db/public-users-store");
  await storeUpsertPublicUser({
    userId: input.userId,
    email: input.email,
    name: input.name,
    fullName: input.name,
  });
}

export async function storeCreatePharmacyOwnerMembership(input: {
  userId: string;
  pharmacyId: string;
}) {
  const { storeCreatePharmacyMembership } = await import(
    "@/lib/db/pharmacy-users-store"
  );
  await storeCreatePharmacyMembership({
    userId: input.userId,
    pharmacyId: input.pharmacyId,
    role: "pharmacy_owner",
  });
}

export async function storeGetSubscriptionPlanNameById(
  id: string,
): Promise<string | null> {
  return getSubscriptionPlanNameByIdFromDb(id);
}

export async function storeListSubscriptionsForPharmacyDelete(
  pharmacyId: string,
) {
  return listSubscriptionsForPharmacyDeleteFromDb(pharmacyId);
}

export async function storeCancelSubscriptionsByIds(ids: string[]) {
  if (ids.length === 0) return;
  await cancelSubscriptionsByIdsFromDb(ids);
}

export async function storeListAllSubscriptionPlans() {
  return listAllSubscriptionPlansFromDb();
}

export async function storeListActiveSubscriptionPlansForConflict() {
  return listActiveSubscriptionPlansForConflictFromDb();
}

export async function storeListEnabledPlanFeaturesByPlanIds(planIds: string[]) {
  return listEnabledPlanFeaturesByPlanIdsFromDb(planIds);
}

export async function storeCountActiveSubscribersByPlanId() {
  return countActiveSubscribersByPlanIdFromDb();
}

export async function storeCreateSubscriptionPlan(
  data: Record<string, unknown>,
) {
  return createSubscriptionPlanFromDb(
    data as Prisma.subscription_plansCreateInput,
  );
}

export async function storeUpdateSubscriptionPlan(
  id: string,
  data: Record<string, unknown>,
) {
  return updateSubscriptionPlanFromDb(
    id,
    data as Prisma.subscription_plansUpdateInput,
  );
}

export async function storeFindSubscriptionPlanById(id: string) {
  return findSubscriptionPlanByIdFromDb(id);
}

export async function storeCreatePlatformAdminReport(input: {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  storageBucket: string;
  storageObjectPath: string;
}) {
  return createPlatformAdminReportFromDb(input);
}

export async function storeListMainSubsForAdminPharmacyDetail(
  pharmacyId: string,
) {
  return listMainSubsForAdminPharmacyDetailFromDb(pharmacyId);
}

export async function storeListBranchAddonSubsForAdminPharmacyDetail(
  pharmacyId: string,
) {
  return listBranchAddonSubsForAdminPharmacyDetailFromDb(pharmacyId);
}

export async function storeFindActiveBranchAddonCatalog() {
  return findActiveBranchAddonCatalogFromDb();
}

export async function storeFindOwnerPublicUser(userId: string) {
  const { storeFindPublicUserById } = await import("@/lib/db/public-users-store");
  return storeFindPublicUserById(userId);
}
