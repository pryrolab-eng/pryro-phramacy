import type {
  EntitlementPlan,
  EntitlementUsage,
  PharmacyEntitlements,
  ScheduledChangeInfo,
} from "./types";
import { isBranchAddonCatalogName } from "../normalize-plan";
import { resolveAccessBlockReason } from "@/lib/subscription/access-block";
import { normalizeLifecycleStatus, statusGrantsAccess } from "./status";
import { getMaxUsersPerPharmacy } from "@/lib/platform-settings";
import {
  buildEntitlementHelpers,
  buildLimits,
  emptyEntitlements,
  type MainSubscriptionRow,
  resolveJoinedPlan,
} from "./entitlement-helpers";

export type EntitlementsAssemblyDeps = {
  loadPlanById: (planId: string) => Promise<EntitlementPlan | null>;
  loadUsage: () => Promise<EntitlementUsage>;
  getBranchCapacity: () => Promise<{ totalSlots: number }>;
  loadPlanFeatureKeys: (planId: string) => Promise<string[]>;
};

export async function assemblePharmacyEntitlements(
  pharmacyId: string,
  pharmacyStatus: string,
  candidates: MainSubscriptionRow[],
  deps: EntitlementsAssemblyDeps,
): Promise<PharmacyEntitlements> {
  const isMainTierSub = (r: MainSubscriptionRow) => {
    const joined = resolveJoinedPlan(r);
    if (joined && isBranchAddonCatalogName(joined.name)) return false;
    return true;
  };

  const pendingPaidMain = candidates.find((r) => {
    if (!isMainTierSub(r)) return false;
    const lifecycle = normalizeLifecycleStatus(r.status, {
      is_active: r.is_active,
      payment_method: r.payment_method,
      pending_change_status: r.pending_change_status,
    });
    if (lifecycle !== "pending_payment") return false;
    const joined = resolveJoinedPlan(r);
    return joined != null && Number(joined.price) > 0;
  });

  const main =
    pendingPaidMain ??
    candidates.find(
      (r) =>
        isMainTierSub(r) &&
        statusGrantsAccess(
          normalizeLifecycleStatus(r.status, {
            is_active: r.is_active,
            payment_method: r.payment_method,
            pending_change_status: r.pending_change_status,
          }),
        ),
    ) ??
    candidates.find((r) => r.is_active && isMainTierSub(r)) ??
    null;

  if (!main) {
    const accessBlockReason = resolveAccessBlockReason({
      pharmacyStatus,
      hasMainSubscription: false,
      lifecycleStatus: null,
      isExpired: true,
      subscriptionAccessAllowed: false,
    });
    return emptyEntitlements(pharmacyId, pharmacyStatus, accessBlockReason);
  }

  const lifecycleStatus = normalizeLifecycleStatus(main.status, {
    is_active: main.is_active,
    payment_method: main.payment_method,
    pending_change_status: main.pending_change_status,
  });

  let effectivePlan = resolveJoinedPlan(main);
  if (effectivePlan && isBranchAddonCatalogName(effectivePlan.name)) {
    effectivePlan = null;
  }
  if (!effectivePlan && main.plan_id) {
    effectivePlan = await deps.loadPlanById(main.plan_id);
    if (effectivePlan && isBranchAddonCatalogName(effectivePlan.name)) {
      effectivePlan = null;
    }
  }

  const expiresAt = main.expires_at;
  const now = Date.now();
  const isExpired = !expiresAt || new Date(expiresAt).getTime() <= now;
  const subscriptionAccessAllowed =
    statusGrantsAccess(lifecycleStatus) && !isExpired;
  const accessBlockReason = resolveAccessBlockReason({
    pharmacyStatus,
    hasMainSubscription: true,
    lifecycleStatus,
    isExpired,
    subscriptionAccessAllowed,
  });
  const isAccessAllowed = accessBlockReason === "none";

  let daysRemaining: number | null = null;
  if (expiresAt && !isExpired) {
    daysRemaining = Math.max(
      0,
      Math.ceil(
        (new Date(expiresAt).getTime() - now) / (1000 * 60 * 60 * 24),
      ),
    );
  }

  let scheduledChange: ScheduledChangeInfo | null = null;
  if (
    main.pending_change_status === "scheduled" &&
    main.next_plan_id &&
    main.change_scheduled_at
  ) {
    const targetPlan = await deps.loadPlanById(main.next_plan_id);
    if (targetPlan) {
      scheduledChange = {
        status: "scheduled",
        effectiveAt: main.change_scheduled_at,
        changeType: "downgrade",
        targetPlan,
        currentPlan: effectivePlan,
        subscriptionId: main.id,
      };
    }
  }

  const [usage, capacity, featureKeys] = await Promise.all([
    deps.loadUsage(),
    deps.getBranchCapacity(),
    effectivePlan?.id
      ? deps.loadPlanFeatureKeys(effectivePlan.id)
      : Promise.resolve([]),
  ]);

  const limits = buildLimits(effectivePlan, capacity.totalSlots);
  const platformUserCap = await getMaxUsersPerPharmacy();
  limits.maxUsers = Math.min(limits.maxUsers, platformUserCap);
  const helpers = buildEntitlementHelpers(
    featureKeys,
    limits,
    usage,
    isAccessAllowed,
    accessBlockReason,
  );

  return {
    pharmacyId,
    pharmacyStatus,
    effectivePlan,
    effectivePlanLabel: (effectivePlan?.name ?? main.plan ?? "standard")
      .toString()
      .toLowerCase(),
    subscriptionId: main.id,
    lifecycleStatus,
    expiresAt,
    isAccessAllowed,
    accessBlockReason,
    isExpired,
    daysRemaining,
    scheduledChange,
    featureKeys,
    limits,
    usage,
    ...helpers,
  };
}
