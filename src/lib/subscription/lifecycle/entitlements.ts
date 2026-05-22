import type { SupabaseClient } from "@supabase/supabase-js";
import { SUBSCRIPTION_CURRENT_PLAN_EMBED } from "../embed-plan";
import {
  type EntitlementPlan,
  type PharmacyEntitlements,
  type ScheduledChangeInfo,
} from "./types";
import { normalizeLifecycleStatus, statusGrantsAccess } from "./status";

type MainSubscriptionRow = {
  id: string;
  pharmacy_id: string;
  plan_id: string | null;
  plan: string;
  status: string | null;
  is_active: boolean | null;
  expires_at: string | null;
  payment_method: string | null;
  next_plan_id: string | null;
  change_scheduled_at: string | null;
  change_type: string | null;
  pending_change_status: string | null;
  subscription_plans?: EntitlementPlan | EntitlementPlan[] | null;
};

function resolveJoinedPlan(
  row: MainSubscriptionRow
): EntitlementPlan | null {
  const joined = row.subscription_plans;
  if (!joined) return null;
  const plan = Array.isArray(joined) ? joined[0] : joined;
  if (!plan?.id && !(plan as EntitlementPlan).name) return null;
  const p = plan as EntitlementPlan;
  return {
    id: p.id,
    name: String(p.name),
    price: Number(p.price ?? 0),
    period: p.period ?? null,
    max_users: p.max_users,
    max_branches: p.max_branches,
    monthly_tx_limit: p.monthly_tx_limit,
  };
}

async function loadPlanById(
  admin: SupabaseClient,
  planId: string
): Promise<EntitlementPlan | null> {
  const { data } = await admin
    .from("subscription_plans")
    .select("id, name, price, period, max_users, max_branches, monthly_tx_limit")
    .eq("id", planId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id as string,
    name: String(data.name),
    price: Number(data.price ?? 0),
    period: data.period as string | null,
    max_users: data.max_users as number | undefined,
    max_branches: data.max_branches as number | undefined,
    monthly_tx_limit: data.monthly_tx_limit as number | undefined,
  };
}

/**
 * Single entitlement resolver — use for layouts, APIs, and gates.
 * Effective plan ignores next_plan_id until scheduled change is applied.
 */
export async function resolvePharmacyEntitlements(
  admin: SupabaseClient,
  pharmacyId: string
): Promise<PharmacyEntitlements> {
  const { data: rows, error } = await admin
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
      change_type,
      pending_change_status,
      ${SUBSCRIPTION_CURRENT_PLAN_EMBED} (
        id, name, price, period, max_users, max_branches, monthly_tx_limit
      )
    `
    )
    .eq("pharmacy_id", pharmacyId)
    .eq("subscription_type", "main")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const candidates = (rows ?? []) as MainSubscriptionRow[];

  const main =
    candidates.find((r) =>
      statusGrantsAccess(
        normalizeLifecycleStatus(r.status, {
          is_active: r.is_active,
          payment_method: r.payment_method,
          pending_change_status: r.pending_change_status,
        })
      )
    ) ??
    candidates.find((r) => r.is_active) ??
    null;

  if (!main) {
    return {
      pharmacyId,
      effectivePlan: null,
      effectivePlanLabel: "standard",
      subscriptionId: null,
      lifecycleStatus: null,
      expiresAt: null,
      isAccessAllowed: false,
      isExpired: true,
      daysRemaining: null,
      scheduledChange: null,
    };
  }

  const lifecycleStatus = normalizeLifecycleStatus(main.status, {
    is_active: main.is_active,
    payment_method: main.payment_method,
    pending_change_status: main.pending_change_status,
  });

  let effectivePlan = resolveJoinedPlan(main);
  if (!effectivePlan && main.plan_id) {
    effectivePlan = await loadPlanById(admin, main.plan_id);
  }

  const expiresAt = main.expires_at;
  const now = Date.now();
  const isExpired =
    !expiresAt || new Date(expiresAt).getTime() <= now;
  const isAccessAllowed =
    statusGrantsAccess(lifecycleStatus) && !isExpired;

  let daysRemaining: number | null = null;
  if (expiresAt && !isExpired) {
    daysRemaining = Math.max(
      0,
      Math.ceil(
        (new Date(expiresAt).getTime() - now) / (1000 * 60 * 60 * 24)
      )
    );
  }

  let scheduledChange: ScheduledChangeInfo | null = null;
  if (
    main.pending_change_status === "scheduled" &&
    main.next_plan_id &&
    main.change_scheduled_at
  ) {
    const targetPlan = await loadPlanById(admin, main.next_plan_id);
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

  return {
    pharmacyId,
    effectivePlan,
    effectivePlanLabel: (effectivePlan?.name ?? main.plan ?? "standard")
      .toString()
      .toLowerCase(),
    subscriptionId: main.id,
    lifecycleStatus,
    expiresAt,
    isAccessAllowed,
    isExpired,
    daysRemaining,
    scheduledChange,
  };
}
