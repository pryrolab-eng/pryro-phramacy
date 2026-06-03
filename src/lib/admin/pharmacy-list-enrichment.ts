import {
  isFreePlanPrice,
  pharmacyAccessLabel,
  type CatalogPlanLike,
} from "@/lib/admin/plan-stats";
import { resolveAccessBlockReason } from "@/lib/subscription/access-block";
import {
  normalizeLifecycleStatus,
  statusGrantsAccess,
} from "@/lib/subscription/lifecycle/status";
import {
  isBranchAddonCatalogName,
  isMainTierCatalogRow,
} from "@/lib/subscription/normalize-plan";
import type { SubscriptionLifecycleStatus } from "@/lib/subscription/lifecycle/types";

export type AdminMainSubRow = {
  pharmacy_id: string;
  status?: string | null;
  is_active?: boolean | null;
  payment_method?: string | null;
  pending_change_status?: string | null;
  expires_at?: string | null;
  created_at?: string | null;
  subscription_plans?: {
    name?: string;
    price?: unknown;
    plan_type?: string;
  } | null;
};

type ParsedMainSub = {
  lifecycle: SubscriptionLifecycleStatus;
  planName: string;
  planPrice: number;
  expiresAt: string | null;
};

function parseMainSub(row: AdminMainSubRow): ParsedMainSub | null {
  const embedded = row.subscription_plans;
  if (!embedded || !isMainTierCatalogRow(embedded)) return null;
  const planName = String(embedded.name ?? "").trim();
  if (!planName || isBranchAddonCatalogName(planName)) return null;
  const lifecycle = normalizeLifecycleStatus(row.status ?? "", {
    is_active: row.is_active,
    payment_method: row.payment_method,
    pending_change_status: row.pending_change_status,
  });
  return {
    lifecycle,
    planName,
    planPrice: Number(embedded.price ?? 0),
    expiresAt: row.expires_at ?? null,
  };
}

function isSubscriptionExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() <= Date.now();
}

export type AdminPharmacyListFields = {
  /** Legacy pharmacies.status with trial remapped to active (account flag only). */
  status: string;
  /** Access column: active | pending_payment | suspended | inactive | subscription_expired | no_subscription */
  access_status: string;
  access_label: string;
  catalog_plan_name: string | null;
  catalog_plan_price: number | null;
  is_free_plan: boolean;
  subscription_expires_at: string | null;
  pending_plan_name: string | null;
};

/**
 * Subscription-aware plan + access for admin pharmacy tables (stores list, etc.).
 */
export function resolveAdminPharmacyListFields(
  pharmacy: {
    status?: string | null;
    subscription_plan?: string | null;
  },
  mainSubsNewestFirst: AdminMainSubRow[],
  _catalog?: CatalogPlanLike[],
): AdminPharmacyListFields {
  const rawPharmacyStatus = String(pharmacy.status ?? "active").trim().toLowerCase();
  const legacyStatus = rawPharmacyStatus === "trial" ? "active" : rawPharmacyStatus;

  let activeMain: ParsedMainSub | null = null;
  let pendingMain: ParsedMainSub | null = null;

  for (const row of mainSubsNewestFirst) {
    const parsed = parseMainSub(row);
    if (!parsed) continue;
    if (parsed.lifecycle === "pending_payment" && !pendingMain) {
      pendingMain = parsed;
    }
    if (
      statusGrantsAccess(parsed.lifecycle) &&
      !activeMain &&
      !isSubscriptionExpired(parsed.expiresAt)
    ) {
      activeMain = parsed;
    }
  }

  const hasMainSubscription = Boolean(activeMain || pendingMain);
  const activeLifecycle = activeMain?.lifecycle ?? null;
  const subscriptionAccessAllowed = Boolean(
    activeMain &&
      statusGrantsAccess(activeMain.lifecycle) &&
      !isSubscriptionExpired(activeMain.expiresAt),
  );

  const accessBlockReason = resolveAccessBlockReason({
    pharmacyStatus: rawPharmacyStatus,
    hasMainSubscription,
    lifecycleStatus: pendingMain
      ? "pending_payment"
      : activeLifecycle,
    isExpired: activeMain ? isSubscriptionExpired(activeMain.expiresAt) : true,
    subscriptionAccessAllowed: pendingMain
      ? false
      : subscriptionAccessAllowed,
  });

  let access_status: string;
  let access_label: string;

  if (accessBlockReason === "none") {
    access_status = "active";
    access_label = "Active";
  } else if (accessBlockReason === "pending_payment") {
    access_status = "pending_payment";
    access_label = "Pending payment";
  } else if (accessBlockReason === "pharmacy_suspended") {
    access_status = "suspended";
    access_label = "Suspended";
  } else if (accessBlockReason === "pharmacy_inactive") {
    access_status = "inactive";
    access_label = "Inactive";
  } else if (accessBlockReason === "subscription_expired") {
    access_status = "subscription_expired";
    access_label = "Expired";
  } else if (accessBlockReason === "no_subscription") {
    access_status = "no_subscription";
    access_label = "No plan";
  } else {
    access_status = accessBlockReason;
    access_label = pharmacyAccessLabel(legacyStatus);
  }

  const showPendingPlan =
    pendingMain != null &&
    (accessBlockReason === "pending_payment" ||
      accessBlockReason === "no_subscription");

  const catalog_plan_name = showPendingPlan
    ? pendingMain!.planName
    : activeMain?.planName ?? null;
  const catalog_plan_price = showPendingPlan
    ? pendingMain!.planPrice
    : activeMain?.planPrice ?? null;
  const is_free_plan =
    catalog_plan_price != null
      ? isFreePlanPrice(catalog_plan_price)
      : false;

  return {
    status: legacyStatus,
    access_status,
    access_label,
    catalog_plan_name,
    catalog_plan_price,
    is_free_plan,
    subscription_expires_at: activeMain?.expiresAt ?? null,
    pending_plan_name: pendingMain?.planName ?? null,
  };
}
