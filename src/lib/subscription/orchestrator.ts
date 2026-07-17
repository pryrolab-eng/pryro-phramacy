import { logSubscriptionChangeEvent } from "./change-events";
import { isDowngrade, isSameTier, planPriceNumber } from "./compare-plans";
import { resolvePharmacyEntitlements } from "./lifecycle/entitlements";
import { syncPharmacySubscriptionProjection } from "./lifecycle/pharmacy-projection";
import {
  deriveIsActive,
  normalizeLifecycleStatus,
  statusGrantsAccess,
} from "./lifecycle/status";
import type {
  CatalogPlanInput,
  PaymentActivationMeta,
  PharmacyEntitlements,
  ScheduledChangeInfo,
  SubscriptionLifecycleStatus,
} from "./lifecycle/types";
import { computeSubscriptionExpiresAt } from "./plan-enum";
import {
  branchHasAddonSubscription,
  getBranchCapacity,
} from "./branch-addon-capacity";
import {
  provisionBranchUsageForBranch,
  provisionBranchUsageForMainSubscription,
} from "./provision-branch-usage";
import {
  storeGetCatalogPlanDetailsById,
  storeResolveCatalogPlan,
} from "@/lib/db/subscriptions-store";
import {
  storeActivatePendingSubscription,
  storeCancelPendingBranchAddonSubscriptions,
  storeCancelPendingMainSubscriptions,
  storeClearAppliedScheduleMetadata,
  storeClearSubscriptionScheduleFields,
  storeCreateActiveFreeMainSubscription,
  storeCreateActiveMainSubscription,
  storeCreatePendingBranchAddonSubscription,
  storeCreatePendingMainSubscription,
  storeCreatePharmacyBranch,
  storeDeactivateOtherMainSubscriptions,
  storeFindPharmacyBranch,
  storeGetMainSubscriptionRow,
  storeGetSubscriptionById,
  storeCancelMainSubscription,
  storeListDueScheduledDowngradeRows,
  storeListExpiredMainSubscriptions,
  storeMarkSubscriptionCancelledApplied,
  storeMarkSubscriptionExpired,
  storeScheduleMainSubscriptionDowngrade,
} from "@/lib/db/subscription-writes-store";

export class SubscriptionPlanChangeError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "downgrade_use_schedule"
      | "same_tier"
      | "payment_required"
      | "invalid_state"
  ) {
    super(message);
    this.name = "SubscriptionPlanChangeError";
  }
}

export type BeginPaidChangeResult = {
  subscriptionId: string;
  planId: string;
  planName: string;
  amount: number;
  requiresPayment: true;
  status: "pending_payment";
};

export type BeginPaidBranchAddonResult = BeginPaidChangeResult & {
  branchId: string;
  branchName: string;
};

export type NewBranchInput = {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
};

export type ActivateFreeResult = {
  subscriptionId: string;
  planId: string;
  planName: string;
  requiresPayment: false;
  status: "active";
  expiresAt: string;
};

export type ScheduleDowngradeResult = {
  subscriptionId: string;
  effectiveAt: string;
  currentPlan: { id: string; name: string; price: number };
  scheduledPlan: { id: string; name: string; price: number };
  replaced: boolean;
};

export type ApplyScheduledBatchResult = {
  processed: number;
  applied: number;
  skipped: number;
  errors: string[];
};

/**
 * Single authoritative write path for subscription lifecycle.
 */
export class SubscriptionOrchestrator {
  constructor() {}

  // ─── Read ─────────────────────────────────────────────

  async getEntitlements(pharmacyId: string): Promise<PharmacyEntitlements> {
    return resolvePharmacyEntitlements(pharmacyId);
  }

  async getScheduledChange(
    pharmacyId: string
  ): Promise<ScheduledChangeInfo | null> {
    const ent = await this.getEntitlements(pharmacyId);
    return ent.scheduledChange;
  }

  // ─── Plan catalog ───────────────────────────────────────

  async resolveCatalogPlan(planIdOrName: string): Promise<CatalogPlanInput> {
    return storeResolveCatalogPlan(planIdOrName);
  }

  private async getMainSubscriptionRow(pharmacyId: string) {
    return storeGetMainSubscriptionRow(pharmacyId);
  }

  private async assertUpgrade(
    pharmacyId: string,
    target: CatalogPlanInput
  ): Promise<void> {
    const ent = await this.getEntitlements(pharmacyId);
    const currentPrice = ent.effectivePlan?.price ?? 0;
    const targetPrice = planPriceNumber(target);

    if (ent.scheduledChange) {
      await this.clearScheduleFields(ent.subscriptionId!);
    }

    if (isSameTier({ price: currentPrice }, { price: targetPrice })) {
      throw new SubscriptionPlanChangeError(
        "This plan is the same tier as your current plan.",
        "same_tier"
      );
    }

    if (isDowngrade({ price: currentPrice }, { price: targetPrice })) {
      throw new SubscriptionPlanChangeError(
        "Downgrades take effect at your next renewal. Use POST /api/subscriptions/schedule-downgrade.",
        "downgrade_use_schedule"
      );
    }
  }

  private async clearScheduleFields(subscriptionId: string): Promise<void> {
    await storeClearSubscriptionScheduleFields(subscriptionId);
  }

  private async deactivateOtherMainSubscriptions(
    pharmacyId: string,
    exceptId: string
  ): Promise<void> {
    await storeDeactivateOtherMainSubscriptions(pharmacyId, exceptId);
  }

  private async syncProjection(pharmacyId: string): Promise<void> {
    const ent = await this.getEntitlements(pharmacyId);
    await syncPharmacySubscriptionProjection(pharmacyId, {
      plan: ent.effectivePlan,
      expiresAt: ent.expiresAt,
      accessAllowed: ent.isAccessAllowed,
    });
  }

  // ─── Upgrades / paid checkout ───────────────────────────

  async beginPaidPlanChange(
    pharmacyId: string,
    planIdOrName: string
  ): Promise<BeginPaidChangeResult> {
    const plan = await this.resolveCatalogPlan(planIdOrName);
    const planPrice = Number(plan.price ?? 0);

    if (planPrice <= 0) {
      throw new SubscriptionPlanChangeError(
        "Free plans must use the free activation path.",
        "invalid_state"
      );
    }

    const existing = await this.getMainSubscriptionRow(pharmacyId);
    if (existing && existing.status === "pending_payment") {
      if (existing.plan_id === plan.id) {
        return {
          subscriptionId: existing.id,
          planId: plan.id,
          planName: plan.name,
          amount: planPrice,
          requiresPayment: true,
          status: "pending_payment",
        };
      }
      await storeCancelPendingMainSubscriptions(pharmacyId);
    } else {
      await this.assertUpgrade(pharmacyId, plan);
      await storeCancelPendingMainSubscriptions(pharmacyId);
    }

    const subscriptionId = await storeCreatePendingMainSubscription({
      pharmacyId,
      planId: plan.id,
      planName: plan.name,
    });

    return {
      subscriptionId,
      planId: plan.id,
      planName: plan.name,
      amount: planPrice,
      requiresPayment: true,
      status: "pending_payment",
    };
  }

  async activateFreePlan(
    pharmacyId: string,
    planIdOrName: string
  ): Promise<ActivateFreeResult> {
    const plan = await this.resolveCatalogPlan(planIdOrName);
    const planPrice = Number(plan.price ?? 0);
    if (planPrice > 0) {
      throw new SubscriptionPlanChangeError(
        "Paid plans require payment before activation.",
        "payment_required"
      );
    }

    await this.assertUpgrade(pharmacyId, plan);

    const now = new Date();
    const expiresAt = computeSubscriptionExpiresAt(
      plan.period ?? plan.billing_period,
      now
    );
    const subId = await storeCreateActiveFreeMainSubscription({
      pharmacyId,
      planId: plan.id,
      planName: plan.name,
      expiresAt,
      periodStart: now,
    });
    await this.deactivateOtherMainSubscriptions(pharmacyId, subId);
    await this.syncProjection(pharmacyId);
    await provisionBranchUsageForMainSubscription({
      pharmacyId,
      subscriptionId: subId,
      planId: plan.id,
    });

    return {
      subscriptionId: subId,
      planId: plan.id,
      planName: plan.name,
      requiresPayment: false,
      status: "active",
      expiresAt: expiresAt.toISOString(),
    };
  }

  private async provisionMainBranchUsageIfApplicable(
    subscriptionId: string,
    pharmacyId: string,
    planId: string | null,
    subscriptionType: string | null | undefined
  ): Promise<void> {
    if (subscriptionType === "branch_addon") return;
    await provisionBranchUsageForMainSubscription({
      pharmacyId,
      subscriptionId,
      planId,
    });
  }

  private async provisionAfterActivation(
    subscriptionId: string,
    pharmacyId: string,
    planId: string | null,
    subscriptionType: string | null | undefined,
    branchId: string | null
  ): Promise<void> {
    if (subscriptionType === "branch_addon" && branchId && planId) {
      await provisionBranchUsageForBranch({
        branchId,
        pharmacyId,
        subscriptionId,
        planId,
      });
      return;
    }
    await this.provisionMainBranchUsageIfApplicable(
      subscriptionId,
      pharmacyId,
      planId,
      subscriptionType
    );
  }

  private async resolveBranchAddonPlan(planIdOrName: string) {
    const plan = await this.resolveCatalogPlan(planIdOrName);
    const row = await storeGetCatalogPlanDetailsById(plan.id);

    if (!row) {
      throw new Error("Branch add-on plan not found");
    }
    if (row.plan_type !== "branch_addon") {
      throw new Error("Selected plan is not a branch add-on plan");
    }
    return {
      ...plan,
      monthly_tx_limit: row.monthly_tx_limit,
    };
  }

  private async assertMainSubscriptionActive(pharmacyId: string): Promise<void> {
    const ent = await this.getEntitlements(pharmacyId);
    if (!ent.isAccessAllowed) {
      throw new SubscriptionPlanChangeError(
        "An active main subscription is required before purchasing a branch add-on.",
        "invalid_state"
      );
    }
  }

  /**
   * Start paid branch add-on checkout. Creates a branch when `newBranch` is provided
   * (required when at main-plan branch limit).
   */
  async beginPaidBranchAddon(
    pharmacyId: string,
    planIdOrName: string,
    options: { branchId?: string; newBranch?: NewBranchInput }
  ): Promise<BeginPaidBranchAddonResult> {
    await this.assertMainSubscriptionActive(pharmacyId);

    const plan = await this.resolveBranchAddonPlan(planIdOrName);
    const planPrice = Number(plan.price ?? 0);
    if (planPrice <= 0) {
      throw new SubscriptionPlanChangeError(
        "Free branch add-ons use the free activation path.",
        "invalid_state"
      );
    }

    const capacity = await getBranchCapacity(pharmacyId);
    let branchId = options.branchId;
    let branchName = "";

    if (options.newBranch) {
      if (!options.newBranch.name?.trim()) {
        throw new Error("Branch name is required");
      }
      if (!capacity.needsAddonForNewBranch) {
        throw new Error(
          "Your plan still has included branch slots. Add a branch without an add-on first."
        );
      }
      if (capacity.branchCount > capacity.totalSlots) {
        throw new Error(
          "Purchase another branch add-on or upgrade your main plan before adding more branches."
        );
      }

      const branch = await storeCreatePharmacyBranch({
        pharmacyId,
        name: options.newBranch.name.trim(),
        address: options.newBranch.address?.trim() || null,
        phone: options.newBranch.phone?.trim() || null,
        email: options.newBranch.email?.trim() || null,
      });
      branchId = branch.id;
      branchName = branch.name;
    }

    if (!branchId) {
      throw new Error("branch_id or newBranch is required");
    }

    const branchRow = await storeFindPharmacyBranch({ pharmacyId, branchId });

    if (!branchRow) {
      throw new Error("Branch not found for this pharmacy");
    }
    branchName = branchName || branchRow.name;

    if (await branchHasAddonSubscription(pharmacyId, branchId)) {
      throw new Error("This branch already has a branch add-on subscription");
    }

    await storeCancelPendingBranchAddonSubscriptions({ pharmacyId, branchId });

    const subscriptionId = await storeCreatePendingBranchAddonSubscription({
      pharmacyId,
      planId: plan.id,
      planName: plan.name,
      branchId,
    });

    return {
      subscriptionId,
      planId: plan.id,
      planName: plan.name,
      amount: planPrice,
      requiresPayment: true,
      status: "pending_payment",
      branchId,
      branchName,
    };
  }

  /**
   * Idempotent-safe paid activation after Polar confirmation.
   * Sets expires_at from payment time (not pending creation time).
   */
  async activateAfterPayment(
    subscriptionId: string,
    meta?: PaymentActivationMeta
  ): Promise<{ ok: boolean; error?: string; alreadyActive?: boolean }> {
    const sub = await storeGetSubscriptionById(subscriptionId);

    if (!sub) {
      return { ok: false, error: "Subscription not found" };
    }

    const pharmacyId = sub.pharmacy_id;
    const planId = sub.plan_id;
    const subscriptionType = sub.subscription_type;
    const branchId = sub.branch_id;

    const status = normalizeLifecycleStatus(sub.status, {});
    if (status === "active" && sub.expires_at) {
      if (subscriptionType !== "branch_addon") {
        await this.syncProjection(pharmacyId);
      }
      await this.provisionAfterActivation(
        subscriptionId,
        pharmacyId,
        planId,
        subscriptionType,
        branchId
      );
      return { ok: true, alreadyActive: true };
    }

    if (status !== "pending_payment") {
      return {
        ok: false,
        error: `Cannot activate subscription in status: ${status}`,
      };
    }

    let periodSource: string | null = null;
    if (sub.plan_id) {
      const catalog = await storeGetCatalogPlanDetailsById(sub.plan_id);
      periodSource = catalog?.period ?? catalog?.billing_period ?? null;
    }

    const now = new Date();
    const expiresAt = computeSubscriptionExpiresAt(periodSource, now);
    const planName = meta?.planName ?? String(sub.plan ?? "");

    await storeActivatePendingSubscription({
      subscriptionId,
      planName,
      expiresAt,
      periodStart: now,
      paymentMethod: meta?.paymentMethod ?? "paid",
      paymentReference: meta?.paymentReference ?? null,
    });

    if (subscriptionType !== "branch_addon") {
      await this.deactivateOtherMainSubscriptions(pharmacyId, subscriptionId);
      await this.syncProjection(pharmacyId);
    }

    await this.provisionAfterActivation(
      subscriptionId,
      pharmacyId,
      planId,
      subscriptionType,
      branchId
    );

    return { ok: true };
  }

  /** Validates upgrade path (clears scheduled downgrade when upgrading). */
  async validatePlanUpgrade(
    pharmacyId: string,
    planIdOrName: string
  ): Promise<void> {
    const plan = await this.resolveCatalogPlan(planIdOrName);
    await this.assertUpgrade(pharmacyId, plan);
  }

  /** Unified entry: free activates immediately; paid returns pending checkout row. */
  async requestPlanChange(pharmacyId: string, planIdOrName: string) {
    const plan = await this.resolveCatalogPlan(planIdOrName);
    if (Number(plan.price ?? 0) <= 0) {
      return this.activateFreePlan(pharmacyId, planIdOrName);
    }
    return this.beginPaidPlanChange(pharmacyId, planIdOrName);
  }

  // ─── Scheduled downgrade ────────────────────────────────

  async scheduleDowngrade(
    pharmacyId: string,
    targetPlanIdOrName: string
  ): Promise<ScheduleDowngradeResult> {
    const active = await this.getMainSubscriptionRow(pharmacyId);
    if (!active) throw new Error("No active subscription found");
    if (!active.expires_at) {
      throw new Error("Active subscription has no expiration date");
    }

    const effectiveAt = new Date(active.expires_at as string);
    if (effectiveAt.getTime() <= Date.now()) {
      throw new Error(
        "Subscription has already expired. Renew or upgrade before scheduling a downgrade."
      );
    }

    const targetPlan = await this.resolveCatalogPlan(targetPlanIdOrName);

    const joined = active.subscription_plans as
      | { id: string; name: string; price: number }
      | { id: string; name: string; price: number }[]
      | null;
    const catalog = Array.isArray(joined) ? joined[0] : joined;
    const currentPrice = catalog ? planPriceNumber(catalog) : 0;
    const currentPlanId = (active.plan_id as string) ?? catalog?.id ?? null;

    if (isSameTier({ price: currentPrice }, { price: targetPlan.price })) {
      throw new Error(
        "This plan is the same tier as your current plan. Choose a different plan."
      );
    }
    if (!isDowngrade({ price: currentPrice }, { price: targetPlan.price })) {
      throw new Error(
        "Target plan is not a downgrade. Use the upgrade flow for higher-tier plans."
      );
    }

    const replaced =
      active.pending_change_status === "scheduled" && !!active.next_plan_id;

    await storeScheduleMainSubscriptionDowngrade({
      subscriptionId: active.id,
      targetPlanId: targetPlan.id,
      effectiveAt: active.expires_at as string,
    });

    await logSubscriptionChangeEvent({
      pharmacyId,
      subscriptionId: active.id as string,
      event: "downgrade_scheduled",
      fromPlanId: currentPlanId,
      toPlanId: targetPlan.id,
      metadata: {
        effective_at: active.expires_at,
        replaced_previous: replaced,
      },
    });

    await this.syncProjection(pharmacyId);

    return {
      subscriptionId: active.id as string,
      effectiveAt: active.expires_at as string,
      currentPlan: {
        id: currentPlanId ?? (active.id as string),
        name: catalog?.name ?? String(active.plan),
        price: currentPrice,
      },
      scheduledPlan: {
        id: targetPlan.id,
        name: targetPlan.name,
        price: planPriceNumber(targetPlan),
      },
      replaced,
    };
  }

  async cancelScheduledDowngrade(pharmacyId: string): Promise<{ canceled: boolean }> {
    const active = await this.getMainSubscriptionRow(pharmacyId);
    if (
      !active ||
      active.pending_change_status !== "scheduled" ||
      !active.next_plan_id
    ) {
      return { canceled: false };
    }

    await storeClearSubscriptionScheduleFields(active.id);

    await logSubscriptionChangeEvent({
      pharmacyId,
      subscriptionId: active.id,
      event: "downgrade_canceled",
      fromPlanId: active.plan_id as string | null,
      toPlanId: active.next_plan_id as string,
    });

    await this.syncProjection(pharmacyId);
    return { canceled: true };
  }

  async applyDueScheduledChanges(): Promise<ApplyScheduledBatchResult> {
    const rows = await storeListDueScheduledDowngradeRows();

    const result: ApplyScheduledBatchResult = {
      processed: rows.length,
      applied: 0,
      skipped: 0,
      errors: [],
    };

    for (const row of rows) {
      try {
        const applied = await this.applyScheduledDowngradeForRow(row);
        if (applied) result.applied += 1;
        else result.skipped += 1;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        result.errors.push(`${row.id}: ${msg}`);
      }
    }

    return result;
  }

  private async applyScheduledDowngradeForRow(row: {
    id: string;
    pharmacy_id: string;
    plan_id: string | null;
    next_plan_id: string;
  }): Promise<boolean> {
    const targetPlan = await this.resolveCatalogPlan(row.next_plan_id);
    const fromPlanId = row.plan_id;
    const pharmacyId = row.pharmacy_id as string;

    await storeMarkSubscriptionCancelledApplied(row.id);

    if (Number(targetPlan.price ?? 0) <= 0) {
      await this.activateFreePlanAfterDowngrade(pharmacyId, targetPlan);
    } else {
      const now = new Date();
      const expiresAt = computeSubscriptionExpiresAt(
        targetPlan.period ?? targetPlan.billing_period,
        now,
      );

      const newSubId = await storeCreateActiveMainSubscription({
        pharmacyId,
        planId: targetPlan.id,
        planName: targetPlan.name,
        expiresAt,
        periodStart: now,
        paymentMethod: "scheduled_change",
      });

      await this.deactivateOtherMainSubscriptions(pharmacyId, newSubId);
      await provisionBranchUsageForMainSubscription({
        pharmacyId,
        subscriptionId: newSubId,
        planId: targetPlan.id,
      });
    }

    await storeClearAppliedScheduleMetadata(row.id);

    await logSubscriptionChangeEvent({
      pharmacyId,
      subscriptionId: row.id,
      event: "downgrade_applied",
      fromPlanId,
      toPlanId: targetPlan.id,
    });

    await this.syncProjection(pharmacyId);
    return true;
  }

  /** Free activation after scheduled downgrade (skips upgrade/downgrade checks). */
  private async activateFreePlanAfterDowngrade(
    pharmacyId: string,
    plan: CatalogPlanInput
  ): Promise<void> {
    const now = new Date();
    const expiresAt = computeSubscriptionExpiresAt(
      plan.period ?? plan.billing_period,
      now
    );
    const subId = await storeCreateActiveMainSubscription({
      pharmacyId,
      planId: plan.id,
      planName: plan.name,
      expiresAt,
      periodStart: now,
      paymentMethod: "scheduled_change",
    });
    await this.deactivateOtherMainSubscriptions(pharmacyId, subId);
    await provisionBranchUsageForMainSubscription({
      pharmacyId,
      subscriptionId: subId,
      planId: plan.id,
    });
  }

  // ─── Cancellation & expiration ──────────────────────────

  async cancelSubscription(
    subscriptionId: string,
    pharmacyId: string
  ): Promise<void> {
    await storeCancelMainSubscription({ subscriptionId, pharmacyId });
    await this.syncProjection(pharmacyId);

    try {
      const { prisma } = await import("@/lib/db/prisma");
      const {
        emitPlatformAdminNotification,
        PLATFORM_ADMIN_EVENT,
      } = await import("@/lib/notifications/platform-admin");
      const pharmacy = await prisma.pharmacies.findUnique({
        where: { id: pharmacyId },
        select: { name: true },
      });
      await emitPlatformAdminNotification({
        eventType: PLATFORM_ADMIN_EVENT.subscriptionCancelled,
        title: "Subscription cancelled",
        message: pharmacy?.name
          ? `${pharmacy.name} cancelled their subscription.`
          : "A pharmacy cancelled their subscription.",
        type: "warning",
        actionUrl: `/admin/tenants`,
        payload: {
          pharmacyId,
          pharmacyName: pharmacy?.name,
          subscriptionId,
        },
      });
    } catch (error) {
      console.error("cancelSubscription platform notify:", error);
    }
  }

  /** Mark main subscriptions past expires_at as expired and sync pharmacy cache. */
  async processExpiredSubscriptions(): Promise<{ expired: number }> {
    const rows = await storeListExpiredMainSubscriptions();

    let count = 0;
    for (const row of rows) {
      await storeMarkSubscriptionExpired(row.id);
      await this.syncProjection(row.pharmacy_id);
      count += 1;
    }
    return { expired: count };
  }
}

export function createSubscriptionOrchestrator(): SubscriptionOrchestrator {
  return new SubscriptionOrchestrator();
}
