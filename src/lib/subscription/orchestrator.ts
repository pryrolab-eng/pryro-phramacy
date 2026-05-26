import type { SupabaseClient } from "@supabase/supabase-js";
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
import { computeSubscriptionExpiresAt, planNameToEnum } from "./plan-enum";
import {
  branchHasAddonSubscription,
  getBranchCapacity,
} from "./branch-addon-capacity";
import {
  provisionBranchUsageForBranch,
  provisionBranchUsageForMainSubscription,
} from "./provision-branch-usage";
import { SUBSCRIPTION_CURRENT_PLAN_EMBED } from "./embed-plan";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  constructor(private readonly admin: SupabaseClient) {}

  // ─── Read ─────────────────────────────────────────────

  async getEntitlements(pharmacyId: string): Promise<PharmacyEntitlements> {
    return resolvePharmacyEntitlements(this.admin, pharmacyId);
  }

  async getScheduledChange(
    pharmacyId: string
  ): Promise<ScheduledChangeInfo | null> {
    const ent = await this.getEntitlements(pharmacyId);
    return ent.scheduledChange;
  }

  // ─── Plan catalog ───────────────────────────────────────

  async resolveCatalogPlan(planIdOrName: string): Promise<CatalogPlanInput> {
    let q = this.admin
      .from("subscription_plans")
      .select("id, name, price, period, billing_period, is_active")
      .eq("is_active", true);

    if (UUID_RE.test(planIdOrName)) {
      q = q.eq("id", planIdOrName);
    } else {
      q = q.ilike("name", planIdOrName);
    }

    const { data: plan, error } = await q.maybeSingle();
    if (error || !plan) {
      throw new Error("Plan not found or is not available");
    }
    return {
      id: plan.id as string,
      name: String(plan.name),
      price: plan.price,
      period: (plan.period as string) ?? null,
      billing_period: (plan.billing_period as string) ?? null,
    };
  }

  private async getMainSubscriptionRow(pharmacyId: string) {
    const { data, error } = await this.admin
      .from("subscriptions")
      .select(
        `
        id,
        pharmacy_id,
        plan_id,
        plan,
        status,
        is_active,
        expires_at,
        payment_method,
        next_plan_id,
        change_scheduled_at,
        pending_change_status,
        ${SUBSCRIPTION_CURRENT_PLAN_EMBED} ( id, name, price, period )
      `
      )
      .eq("pharmacy_id", pharmacyId)
      .eq("subscription_type", "main")
      .in("status", ["active", "scheduled_change", "pending_payment", "pending"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
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
    await this.admin
      .from("subscriptions")
      .update({
        next_plan_id: null,
        change_scheduled_at: null,
        change_type: null,
        pending_change_status: null,
        status: "active",
        is_active: true,
      })
      .eq("id", subscriptionId);
  }

  private async deactivateOtherMainSubscriptions(
    pharmacyId: string,
    exceptId: string
  ): Promise<void> {
    await this.admin
      .from("subscriptions")
      .update({
        status: "cancelled",
        is_active: false,
        cancelled_at: new Date().toISOString(),
      })
      .eq("pharmacy_id", pharmacyId)
      .eq("subscription_type", "main")
      .neq("id", exceptId)
      .in("status", ["active", "scheduled_change", "pending_payment", "pending"]);
  }

  private async syncProjection(pharmacyId: string): Promise<void> {
    const ent = await this.getEntitlements(pharmacyId);
    await syncPharmacySubscriptionProjection(this.admin, pharmacyId, {
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

    await this.assertUpgrade(pharmacyId, plan);

    await this.admin
      .from("subscriptions")
      .update({
        status: "cancelled",
        is_active: false,
        payment_method: "cancelled",
      })
      .eq("pharmacy_id", pharmacyId)
      .eq("subscription_type", "main")
      .in("status", ["pending_payment", "pending"]);

    const planEnum = planNameToEnum(plan.name);

    const { data: subscription, error } = await this.admin
      .from("subscriptions")
      .insert({
        pharmacy_id: pharmacyId,
        plan_id: plan.id,
        plan: planEnum,
        subscription_type: "main",
        status: "pending_payment",
        is_active: false,
        expires_at: null,
        current_period_start: null,
        current_period_end: null,
        payment_method: "pending",
      })
      .select("id")
      .single();

    if (error || !subscription) {
      throw new Error(error?.message || "Failed to create pending subscription");
    }

    return {
      subscriptionId: subscription.id as string,
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
    const planEnum = planNameToEnum(plan.name);

    const { data: subscription, error } = await this.admin
      .from("subscriptions")
      .insert({
        pharmacy_id: pharmacyId,
        plan_id: plan.id,
        plan: planEnum,
        subscription_type: "main",
        status: "active",
        is_active: true,
        expires_at: expiresAt.toISOString(),
        current_period_start: now.toISOString(),
        current_period_end: expiresAt.toISOString(),
        payment_method: "free",
      })
      .select("id")
      .single();

    if (error || !subscription) {
      throw new Error(error?.message || "Failed to activate free plan");
    }

    const subId = subscription.id as string;
    await this.deactivateOtherMainSubscriptions(pharmacyId, subId);
    await this.syncProjection(pharmacyId);
    await provisionBranchUsageForMainSubscription(this.admin, {
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
    await provisionBranchUsageForMainSubscription(this.admin, {
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
      await provisionBranchUsageForBranch(this.admin, {
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
    const { data: row, error } = await this.admin
      .from("subscription_plans")
      .select("id, name, price, period, billing_period, plan_type, monthly_tx_limit")
      .eq("id", plan.id)
      .maybeSingle();

    if (error || !row) {
      throw new Error("Branch add-on plan not found");
    }
    if (row.plan_type !== "branch_addon") {
      throw new Error("Selected plan is not a branch add-on plan");
    }
    return {
      ...plan,
      monthly_tx_limit: row.monthly_tx_limit as number,
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

    const capacity = await getBranchCapacity(this.admin, pharmacyId);
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

      const { data: branch, error: branchErr } = await this.admin
        .from("branches")
        .insert({
          pharmacy_id: pharmacyId,
          name: options.newBranch.name.trim(),
          address: options.newBranch.address?.trim() || null,
          phone: options.newBranch.phone?.trim() || null,
          email: options.newBranch.email?.trim() || null,
          is_active: true,
        })
        .select("id, name")
        .single();

      if (branchErr || !branch) {
        throw new Error(branchErr?.message || "Failed to create branch");
      }
      branchId = branch.id as string;
      branchName = String(branch.name);
    }

    if (!branchId) {
      throw new Error("branch_id or newBranch is required");
    }

    const { data: branchRow } = await this.admin
      .from("branches")
      .select("id, name, pharmacy_id")
      .eq("id", branchId)
      .eq("pharmacy_id", pharmacyId)
      .maybeSingle();

    if (!branchRow) {
      throw new Error("Branch not found for this pharmacy");
    }
    branchName = branchName || String(branchRow.name);

    if (await branchHasAddonSubscription(this.admin, pharmacyId, branchId)) {
      throw new Error("This branch already has a branch add-on subscription");
    }

    await this.admin
      .from("subscriptions")
      .update({
        status: "cancelled",
        is_active: false,
        payment_method: "cancelled",
      })
      .eq("pharmacy_id", pharmacyId)
      .eq("branch_id", branchId)
      .eq("subscription_type", "branch_addon")
      .in("status", ["pending_payment", "pending"]);

    const planEnum = planNameToEnum(plan.name);
    const { data: subscription, error } = await this.admin
      .from("subscriptions")
      .insert({
        pharmacy_id: pharmacyId,
        plan_id: plan.id,
        branch_id: branchId,
        plan: planEnum,
        subscription_type: "branch_addon",
        status: "pending_payment",
        is_active: false,
        expires_at: null,
        payment_method: "pending",
      })
      .select("id")
      .single();

    if (error || !subscription) {
      throw new Error(error?.message || "Failed to create pending branch add-on");
    }

    return {
      subscriptionId: subscription.id as string,
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
   * Idempotent-safe paid activation after KPay/Polar confirmation.
   * Sets expires_at from payment time (not pending creation time).
   */
  async activateAfterPayment(
    subscriptionId: string,
    meta?: PaymentActivationMeta
  ): Promise<{ ok: boolean; error?: string; alreadyActive?: boolean }> {
    const { data: sub, error: subErr } = await this.admin
      .from("subscriptions")
      .select(
        "id, pharmacy_id, plan_id, plan, status, expires_at, subscription_type, branch_id"
      )
      .eq("id", subscriptionId)
      .maybeSingle();

    if (subErr || !sub) {
      return { ok: false, error: subErr?.message || "Subscription not found" };
    }

    const pharmacyId = sub.pharmacy_id as string;
    const planId = sub.plan_id as string | null;
    const subscriptionType = sub.subscription_type as string | null | undefined;
    const branchId = (sub.branch_id as string | null) ?? null;

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
      const { data: catalog } = await this.admin
        .from("subscription_plans")
        .select("name, period, billing_period")
        .eq("id", sub.plan_id)
        .maybeSingle();
      periodSource =
        (catalog?.period as string) ??
        (catalog?.billing_period as string) ??
        null;
    }

    const now = new Date();
    const expiresAt = computeSubscriptionExpiresAt(periodSource, now);
    const planEnum = planNameToEnum(
      meta?.planName ?? String(sub.plan)
    );

    await this.admin
      .from("subscriptions")
      .update({
        status: "active",
        is_active: true,
        plan: planEnum,
        expires_at: expiresAt.toISOString(),
        current_period_start: now.toISOString(),
        current_period_end: expiresAt.toISOString(),
        payment_method: meta?.paymentMethod ?? "paid",
        payment_reference: meta?.paymentReference ?? null,
      })
      .eq("id", subscriptionId);

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

    await this.admin
      .from("subscriptions")
      .update({
        next_plan_id: targetPlan.id,
        change_scheduled_at: active.expires_at,
        change_type: "downgrade",
        pending_change_status: "scheduled",
        status: "scheduled_change",
        is_active: true,
      })
      .eq("id", active.id);

    await logSubscriptionChangeEvent(this.admin, {
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

    await this.admin
      .from("subscriptions")
      .update({
        next_plan_id: null,
        change_scheduled_at: null,
        change_type: null,
        pending_change_status: null,
        status: "active",
        is_active: true,
      })
      .eq("id", active.id);

    await logSubscriptionChangeEvent(this.admin, {
      pharmacyId,
      subscriptionId: active.id as string,
      event: "downgrade_canceled",
      fromPlanId: active.plan_id as string | null,
      toPlanId: active.next_plan_id as string,
    });

    await this.syncProjection(pharmacyId);
    return { canceled: true };
  }

  async applyDueScheduledChanges(): Promise<ApplyScheduledBatchResult> {
    const now = new Date().toISOString();
    const { data: rows, error } = await this.admin
      .from("subscriptions")
      .select(
        "id, pharmacy_id, plan_id, plan, expires_at, next_plan_id, change_scheduled_at, pending_change_status, status"
      )
      .eq("subscription_type", "main")
      .eq("pending_change_status", "scheduled")
      .not("next_plan_id", "is", null)
      .lte("change_scheduled_at", now)
      .in("status", ["active", "scheduled_change"]);

    if (error) throw new Error(error.message);

    const result: ApplyScheduledBatchResult = {
      processed: rows?.length ?? 0,
      applied: 0,
      skipped: 0,
      errors: [],
    };

    for (const row of rows ?? []) {
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

    await this.admin
      .from("subscriptions")
      .update({
        status: "cancelled",
        is_active: false,
        pending_change_status: "applied",
      })
      .eq("id", row.id);

    if (Number(targetPlan.price ?? 0) <= 0) {
      await this.activateFreePlanAfterDowngrade(pharmacyId, targetPlan);
    } else {
      const now = new Date();
      const expiresAt = computeSubscriptionExpiresAt(
        targetPlan.period ?? targetPlan.billing_period,
        now
      );
      const planEnum = planNameToEnum(targetPlan.name);

      const { data: newSub, error: insertErr } = await this.admin
        .from("subscriptions")
        .insert({
          pharmacy_id: pharmacyId,
          plan_id: targetPlan.id,
          plan: planEnum,
          subscription_type: "main",
          status: "active",
          is_active: true,
          expires_at: expiresAt.toISOString(),
          current_period_start: now.toISOString(),
          current_period_end: expiresAt.toISOString(),
          payment_method: "scheduled_change",
        })
        .select("id")
        .single();

      if (insertErr || !newSub) {
        throw new Error(insertErr?.message || "Failed to create downgraded subscription");
      }

      const newSubId = newSub.id as string;
      await this.deactivateOtherMainSubscriptions(pharmacyId, newSubId);
      await provisionBranchUsageForMainSubscription(this.admin, {
        pharmacyId,
        subscriptionId: newSubId,
        planId: targetPlan.id,
      });
    }

    await this.admin
      .from("subscriptions")
      .update({
        next_plan_id: null,
        change_scheduled_at: null,
        change_type: null,
        pending_change_status: null,
      })
      .eq("id", row.id);

    await logSubscriptionChangeEvent(this.admin, {
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
    const planEnum = planNameToEnum(plan.name);

    const { data: subscription, error } = await this.admin
      .from("subscriptions")
      .insert({
        pharmacy_id: pharmacyId,
        plan_id: plan.id,
        plan: planEnum,
        subscription_type: "main",
        status: "active",
        is_active: true,
        expires_at: expiresAt.toISOString(),
        current_period_start: now.toISOString(),
        current_period_end: expiresAt.toISOString(),
        payment_method: "scheduled_change",
      })
      .select("id")
      .single();

    if (error || !subscription) {
      throw new Error(error?.message || "Failed to activate free plan");
    }

    const subId = subscription.id as string;
    await this.deactivateOtherMainSubscriptions(pharmacyId, subId);
    await provisionBranchUsageForMainSubscription(this.admin, {
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
    const { error } = await this.admin
      .from("subscriptions")
      .update({
        status: "cancelled",
        is_active: false,
        cancelled_at: new Date().toISOString(),
        next_plan_id: null,
        change_scheduled_at: null,
        change_type: null,
        pending_change_status: null,
      })
      .eq("id", subscriptionId)
      .eq("pharmacy_id", pharmacyId);

    if (error) throw new Error(error.message);
    await this.syncProjection(pharmacyId);
  }

  /** Mark main subscriptions past expires_at as expired and sync pharmacy cache. */
  async processExpiredSubscriptions(): Promise<{ expired: number }> {
    const now = new Date().toISOString();
    const { data: rows } = await this.admin
      .from("subscriptions")
      .select("id, pharmacy_id, expires_at")
      .eq("subscription_type", "main")
      .in("status", ["active", "scheduled_change"])
      .lt("expires_at", now);

    let count = 0;
    for (const row of rows ?? []) {
      await this.admin
        .from("subscriptions")
        .update({ status: "expired", is_active: false })
        .eq("id", row.id);
      await this.syncProjection(row.pharmacy_id as string);
      count += 1;
    }
    return { expired: count };
  }
}

export function createSubscriptionOrchestrator(
  admin: SupabaseClient
): SubscriptionOrchestrator {
  return new SubscriptionOrchestrator(admin);
}
