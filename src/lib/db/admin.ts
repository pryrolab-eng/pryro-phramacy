import type {
  pharmacy_status,
  Prisma,
  subscription_plan,
  user_role,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { AdminMainSubRow } from "@/lib/admin/pharmacy-list-enrichment";

function serializeRow<T extends Record<string, unknown>>(row: T): T {
  const out = { ...row } as Record<string, unknown>;
  for (const [key, value] of Object.entries(out)) {
    if (value instanceof Date) {
      out[key] = value.toISOString();
    } else if (
      value &&
      typeof value === "object" &&
      "toNumber" in value &&
      typeof (value as { toNumber: () => number }).toNumber === "function"
    ) {
      out[key] = Number(value);
    }
  }
  return out as T;
}

export async function listGlobalCategoriesFromDb() {
  return prisma.categories.findMany({
    where: { pharmacy_id: null },
    orderBy: { name: "asc" },
  });
}

export async function createGlobalCategoryFromDb(input: {
  name: string;
  description?: string;
}) {
  return prisma.categories.create({
    data: {
      pharmacy_id: null,
      name: input.name,
      description: input.description ?? "",
      is_active: true,
    },
  });
}

export async function updateGlobalCategoryFromDb(
  id: string,
  input: { name?: string; description?: string; isActive?: boolean },
) {
  return prisma.categories.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
      updated_at: new Date(),
    },
  });
}

export async function deleteGlobalCategoryFromDb(id: string) {
  const result = await prisma.categories.deleteMany({
    where: { id, pharmacy_id: null },
  });
  return result.count > 0;
}

export async function listPlatformApiKeysFromDb() {
  return prisma.api_keys.findMany({
    where: { pharmacy_id: null },
    select: {
      id: true,
      name: true,
      key_prefix: true,
      permissions: true,
      is_active: true,
      created_at: true,
    },
    orderBy: { created_at: "desc" },
  });
}

export async function createPlatformApiKeyFromDb(input: {
  name: string;
  keyHash: string;
  keyPrefix: string;
  createdBy: string;
  permissions?: string[];
}) {
  return prisma.api_keys.create({
    data: {
      pharmacy_id: null,
      name: input.name,
      key_hash: input.keyHash,
      key_prefix: input.keyPrefix,
      permissions: input.permissions ?? [],
      is_active: true,
      created_by: input.createdBy,
    },
    select: {
      id: true,
      name: true,
      key_prefix: true,
      permissions: true,
      is_active: true,
      created_at: true,
    },
  });
}

export async function updatePlatformApiKeyFromDb(input: {
  id: string;
  name?: string;
  keyHash?: string;
  keyPrefix?: string;
  isActive?: boolean;
  permissions?: string[];
}) {
  await prisma.api_keys.updateMany({
    where: { id: input.id, pharmacy_id: null },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.keyHash !== undefined ? { key_hash: input.keyHash } : {}),
      ...(input.keyPrefix !== undefined ? { key_prefix: input.keyPrefix } : {}),
      ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
      ...(input.permissions !== undefined ? { permissions: input.permissions } : {}),
    },
  });
}

export async function deletePlatformApiKeyFromDb(id: string) {
  const result = await prisma.api_keys.deleteMany({
    where: { id, pharmacy_id: null },
  });
  return result.count > 0;
}

export async function listGlobalInsuranceTemplatesFromDb() {
  return prisma.insurance_templates.findMany({
    where: { pharmacy_id: null },
    orderBy: { updated_at: "desc" },
  });
}

export async function createGlobalInsuranceTemplateFromDb(input: {
  name: string;
  insuranceProvider: string;
  templateHtml?: string;
  templateCss?: string;
}) {
  return prisma.insurance_templates.create({
    data: {
      pharmacy_id: null,
      name: input.name,
      insurance_provider: input.insuranceProvider,
      template_html: input.templateHtml ?? "",
      template_css: input.templateCss ?? "",
      is_active: true,
    },
  });
}

export async function updateGlobalInsuranceTemplateFromDb(
  id: string,
  input: {
    name?: string;
    insuranceProvider?: string;
    templateHtml?: string;
    templateCss?: string;
    isActive?: boolean;
  },
) {
  return prisma.insurance_templates.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.insuranceProvider !== undefined
        ? { insurance_provider: input.insuranceProvider }
        : {}),
      ...(input.templateHtml !== undefined
        ? { template_html: input.templateHtml }
        : {}),
      ...(input.templateCss !== undefined
        ? { template_css: input.templateCss }
        : {}),
      ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
      updated_at: new Date(),
    },
  });
}

export async function deleteGlobalInsuranceTemplateFromDb(id: string) {
  const result = await prisma.insurance_templates.deleteMany({
    where: { id, pharmacy_id: null },
  });
  return result.count > 0;
}

export async function listPlatformSystemSettingsFromDb() {
  return prisma.system_settings.findMany({
    where: { pharmacy_id: null },
    orderBy: { setting_key: "asc" },
  });
}

export async function upsertPlatformSystemSettingFromDb(input: {
  key: string;
  value: Prisma.InputJsonValue;
}) {
  const existing = await prisma.system_settings.findFirst({
    where: { pharmacy_id: null, setting_key: input.key },
    select: { id: true },
  });

  if (existing) {
    await prisma.system_settings.update({
      where: { id: existing.id },
      data: { setting_value: input.value, updated_at: new Date() },
    });
    return;
  }

  await prisma.system_settings.create({
    data: {
      pharmacy_id: null,
      setting_key: input.key,
      setting_value: input.value,
    },
  });
}

function isOperatingPharmacyStatus(status: string | null | undefined): boolean {
  return status === "active" || status === "trial";
}

export async function getPlatformAnalyticsFromDb() {
  const [pharmacies, users] = await Promise.all([
    prisma.pharmacies.findMany({ select: { id: true, status: true } }),
    prisma.public_users.findMany({ select: { id: true, created_at: true } }),
  ]);

  const cutoffMs = Date.now() - 30 * 24 * 60 * 60 * 1000;

  return {
    active_pharmacies: pharmacies.filter((p) =>
      isOperatingPharmacyStatus(p.status),
    ).length,
    total_pharmacies: pharmacies.length,
    total_users: users.length,
    new_users_30d: users.filter(
      (u) => u.created_at && u.created_at.getTime() > cutoffMs,
    ).length,
  };
}

export async function searchPharmaciesFromDb(pattern: string, limit = 8) {
  return prisma.pharmacies.findMany({
    where: {
      OR: [
        { name: { contains: pattern, mode: "insensitive" } },
        { email: { contains: pattern, mode: "insensitive" } },
        { phone: { contains: pattern, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, email: true, phone: true },
    orderBy: { created_at: "desc" },
    take: limit,
  });
}

export async function listBackupsFromDb() {
  return prisma.backups.findMany({
    orderBy: { created_at: "desc" },
  });
}

export async function createBackupFromDb(input: {
  pharmacyId?: string | null;
  name: string;
  type: string;
  fileSize?: string;
  filePath?: string | null;
  status?: string;
}) {
  return prisma.backups.create({
    data: {
      pharmacy_id: input.pharmacyId ?? null,
      name: input.name,
      type: input.type,
      file_size: input.fileSize ?? null,
      file_path: input.filePath ?? null,
      status: input.status ?? "completed",
    },
  });
}

export async function listAdminPaymentTransactionsFromDb(limit = 200) {
  const rows = await prisma.payment_transactions.findMany({
    orderBy: { created_at: "desc" },
    take: limit,
    select: {
      id: true,
      pharmacy_id: true,
      subscription_id: true,
      amount: true,
      currency: true,
      status: true,
      payment_method: true,
      payment_provider: true,
      payment_details: true,
      customer_name: true,
      customer_email: true,
      customer_phone: true,
      polar_checkout_id: true,
      completed_at: true,
      created_at: true,
      pharmacies: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return rows.map((row) => ({
    ...row,
    amount: Number(row.amount),
    completed_at: row.completed_at?.toISOString() ?? null,
    created_at: row.created_at?.toISOString() ?? null,
    pharmacies: row.pharmacies,
  }));
}

export async function listAdminSubscriptionsFromDb(limit = 200) {
  const rows = await prisma.subscriptions.findMany({
    orderBy: { created_at: "desc" },
    take: limit,
    select: {
      id: true,
      pharmacy_id: true,
      plan: true,
      is_active: true,
      expires_at: true,
      payment_method: true,
    },
  });

  return rows.map((row) => ({
    ...row,
    expires_at: row.expires_at?.toISOString() ?? null,
  }));
}

export async function listPharmaciesForAdminFromDb() {
  const rows = await prisma.pharmacies.findMany({
    orderBy: { created_at: "desc" },
  });
  return rows.map((row) => serializeRow(row as unknown as Record<string, unknown>));
}

export async function listMainSubsForAdminPharmacyListFromDb(): Promise<
  AdminMainSubRow[]
> {
  const rows = await prisma.subscriptions.findMany({
    where: {
      subscription_type: "main",
      status: { in: ["active", "pending_payment", "pending", "scheduled_change"] },
    },
    orderBy: { created_at: "desc" },
    select: {
      pharmacy_id: true,
      plan: true,
      status: true,
      is_active: true,
      payment_method: true,
      pending_change_status: true,
      expires_at: true,
      created_at: true,
      subscription_plans_subscriptions_plan_idTosubscription_plans: {
        select: { name: true, price: true, plan_type: true },
      },
    },
  });

  return rows
    .filter((row) => row.pharmacy_id)
    .map((row) => ({
      pharmacy_id: row.pharmacy_id as string,
      plan: row.plan,
      status: row.status,
      is_active: row.is_active,
      payment_method: row.payment_method,
      pending_change_status: row.pending_change_status,
      expires_at: row.expires_at?.toISOString() ?? null,
      created_at: row.created_at?.toISOString() ?? null,
      subscription_plans: row.subscription_plans_subscriptions_plan_idTosubscription_plans
        ? {
            name: row.subscription_plans_subscriptions_plan_idTosubscription_plans.name,
            price: Number(
              row.subscription_plans_subscriptions_plan_idTosubscription_plans.price,
            ),
            plan_type:
              row.subscription_plans_subscriptions_plan_idTosubscription_plans
                .plan_type,
          }
        : null,
    }));
}

export async function listBranchAddonPharmacyIdsFromDb() {
  const rows = await prisma.subscriptions.findMany({
    where: {
      status: "active",
      subscription_type: "branch_addon",
    },
    select: { pharmacy_id: true },
  });
  return rows
    .map((row) => row.pharmacy_id)
    .filter((id): id is string => Boolean(id));
}

export async function listActiveMainCatalogPlansFromDb() {
  const rows = await prisma.subscription_plans.findMany({
    where: { is_active: true },
    select: { name: true, price: true, plan_type: true },
  });
  return rows.map((row) => ({
    name: row.name,
    price: Number(row.price),
    plan_type: row.plan_type,
  }));
}

export async function findPharmacyByIdFromDb(id: string) {
  const row = await prisma.pharmacies.findUnique({ where: { id } });
  return row
    ? serializeRow(row as unknown as Record<string, unknown>)
    : null;
}

export async function createPharmacyFromDb(input: {
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  licenseNumber: string;
  subscriptionPlan: subscription_plan;
  ownerId: string;
  status?: pharmacy_status;
}) {
  const row = await prisma.pharmacies.create({
    data: {
      name: input.name,
      address: input.address ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      license_number: input.licenseNumber,
      subscription_plan: input.subscriptionPlan,
      status: input.status ?? "active",
      owner_id: input.ownerId,
    },
  });
  return serializeRow(row as unknown as Record<string, unknown>);
}

export async function updatePharmacyFromDb(
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
  const row = await prisma.pharmacies.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.licenseNumber !== undefined
        ? { license_number: input.licenseNumber }
        : {}),
      ...(input.subscriptionPlan !== undefined
        ? { subscription_plan: input.subscriptionPlan }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updated_at: new Date(),
    },
  });
  return serializeRow(row as unknown as Record<string, unknown>);
}

export async function deletePharmacyFromDb(id: string) {
  await prisma.pharmacies.delete({ where: { id } });
}

export async function upsertOwnerPublicUserFromDb(input: {
  userId: string;
  email: string;
  name: string;
}) {
  await prisma.public_users.upsert({
    where: { id: input.userId },
    create: {
      id: input.userId,
      email: input.email,
      name: input.name,
      full_name: input.name,
      user_id: input.userId,
      token_identifier: input.email,
    },
    update: {
      email: input.email,
      name: input.name,
      full_name: input.name,
      updated_at: new Date(),
    },
  });
}

export async function createPharmacyOwnerMembershipFromDb(input: {
  userId: string;
  pharmacyId: string;
  role?: user_role;
}) {
  await prisma.pharmacy_users.create({
    data: {
      user_id: input.userId,
      pharmacy_id: input.pharmacyId,
      role: input.role ?? "pharmacy_owner",
      is_active: true,
    },
  });
}

export async function getSubscriptionPlanNameByIdFromDb(id: string) {
  const row = await prisma.subscription_plans.findUnique({
    where: { id },
    select: { name: true },
  });
  return row?.name ?? null;
}

export type PharmacyDeleteSubRow = {
  id: string;
  status?: string | null;
  is_active?: boolean | null;
  payment_method?: string | null;
  pending_change_status?: string | null;
};

export async function listSubscriptionsForPharmacyDeleteFromDb(
  pharmacyId: string,
): Promise<PharmacyDeleteSubRow[]> {
  return prisma.subscriptions.findMany({
    where: { pharmacy_id: pharmacyId },
    select: {
      id: true,
      status: true,
      is_active: true,
      payment_method: true,
      pending_change_status: true,
    },
  });
}

export async function cancelSubscriptionsByIdsFromDb(ids: string[]) {
  if (ids.length === 0) return;
  await prisma.subscriptions.updateMany({
    where: { id: { in: ids } },
    data: {
      status: "cancelled",
      is_active: false,
      payment_method: "cancelled",
      cancelled_at: new Date(),
    },
  });
}

export async function listAllSubscriptionPlansFromDb() {
  const rows = await prisma.subscription_plans.findMany({
    orderBy: [{ is_active: "desc" }, { price: "asc" }],
  });
  return rows.map((row) => serializeRow(row as unknown as Record<string, unknown>));
}

export async function listActiveSubscriptionPlansForConflictFromDb() {
  return prisma.subscription_plans.findMany({
    where: { is_active: true },
    select: { id: true, name: true, plan_type: true, is_active: true },
  });
}

export async function listEnabledPlanFeaturesByPlanIdsFromDb(planIds: string[]) {
  if (planIds.length === 0) return [];
  return prisma.plan_features.findMany({
    where: { plan_id: { in: planIds }, enabled: true },
    select: { plan_id: true, feature_key: true },
  });
}

export async function countActiveSubscribersByPlanIdFromDb() {
  const rows = await prisma.subscriptions.findMany({
    where: { is_active: true },
    select: { plan_id: true, plan: true, status: true },
  });

  const byPlanId = new Map<string, number>();
  const byPlanName = new Map<string, number>();

  for (const row of rows) {
    const status = String(row.status ?? "");
    if (status === "canceled" || status === "expired") continue;

    if (row.plan_id) {
      byPlanId.set(row.plan_id, (byPlanId.get(row.plan_id) ?? 0) + 1);
      continue;
    }
    const name = String(row.plan ?? "unknown").trim().toLowerCase();
    byPlanName.set(name, (byPlanName.get(name) ?? 0) + 1);
  }

  return { byPlanId, byPlanName };
}

export async function createSubscriptionPlanFromDb(
  data: Prisma.subscription_plansCreateInput,
) {
  const row = await prisma.subscription_plans.create({ data });
  return serializeRow(row as unknown as Record<string, unknown>);
}

export async function updateSubscriptionPlanFromDb(
  id: string,
  data: Prisma.subscription_plansUpdateInput,
) {
  const row = await prisma.subscription_plans.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
  });
  return serializeRow(row as unknown as Record<string, unknown>);
}

export async function findSubscriptionPlanByIdFromDb(id: string) {
  const row = await prisma.subscription_plans.findUnique({ where: { id } });
  return row
    ? serializeRow(row as unknown as Record<string, unknown>)
    : null;
}

export async function createPlatformAdminReportFromDb(input: {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  storageBucket: string;
  storageObjectPath: string;
}) {
  return prisma.platform_admin_reports.create({
    data: {
      id: input.id,
      name: input.name,
      description: input.description ?? null,
      category: input.category ?? null,
      storage_bucket: input.storageBucket,
      storage_object_path: input.storageObjectPath,
    },
    select: { id: true },
  });
}

export type AdminPharmacyDetailMainSubRow = {
  id: string;
  status: string | null;
  is_active: boolean | null;
  expires_at: string | null;
  payment_method: string | null;
  pending_change_status: string | null;
  subscription_plans: {
    name: string;
    price: number;
    plan_type: string | null;
  } | null;
};

export type AdminPharmacyDetailBranchAddonSubRow = {
  id: string;
  status: string | null;
  is_active: boolean | null;
  payment_method: string | null;
  branch_id: string | null;
  subscription_plans: { name: string; price: number } | null;
  branches: { name: string } | null;
};

export async function listMainSubsForAdminPharmacyDetailFromDb(
  pharmacyId: string,
): Promise<AdminPharmacyDetailMainSubRow[]> {
  const rows = await prisma.subscriptions.findMany({
    where: { pharmacy_id: pharmacyId, subscription_type: "main" },
    orderBy: { created_at: "desc" },
    take: 5,
    select: {
      id: true,
      status: true,
      is_active: true,
      expires_at: true,
      payment_method: true,
      pending_change_status: true,
      subscription_plans_subscriptions_plan_idTosubscription_plans: {
        select: { name: true, price: true, plan_type: true },
      },
    },
  });

  return rows.map((row) => {
    const plan = row.subscription_plans_subscriptions_plan_idTosubscription_plans;
    return {
      id: row.id,
      status: row.status,
      is_active: row.is_active,
      expires_at: row.expires_at?.toISOString() ?? null,
      payment_method: row.payment_method,
      pending_change_status: row.pending_change_status,
      subscription_plans: plan
        ? {
            name: plan.name,
            price: Number(plan.price),
            plan_type: plan.plan_type,
          }
        : null,
    };
  });
}

export async function listBranchAddonSubsForAdminPharmacyDetailFromDb(
  pharmacyId: string,
): Promise<AdminPharmacyDetailBranchAddonSubRow[]> {
  const rows = await prisma.subscriptions.findMany({
    where: { pharmacy_id: pharmacyId, subscription_type: "branch_addon" },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      status: true,
      is_active: true,
      payment_method: true,
      branch_id: true,
      subscription_plans_subscriptions_plan_idTosubscription_plans: {
        select: { name: true, price: true },
      },
      branches: { select: { name: true } },
    },
  });

  return rows.map((row) => {
    const plan = row.subscription_plans_subscriptions_plan_idTosubscription_plans;
    return {
      id: row.id,
      status: row.status,
      is_active: row.is_active,
      payment_method: row.payment_method,
      branch_id: row.branch_id,
      subscription_plans: plan
        ? { name: plan.name, price: Number(plan.price) }
        : null,
      branches: row.branches ? { name: row.branches.name } : null,
    };
  });
}

export async function findActiveBranchAddonCatalogFromDb() {
  const row = await prisma.subscription_plans.findFirst({
    where: { plan_type: "branch_addon", is_active: true },
    orderBy: { price: "asc" },
    select: { name: true, price: true },
  });
  return row ? { name: row.name, price: Number(row.price) } : null;
}

export { findPublicUserByIdFromDb } from "@/lib/db/public-users";
