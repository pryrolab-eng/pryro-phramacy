import type { SupabaseClient } from "@supabase/supabase-js";
import { logSubscriptionChangeEvent } from "./change-events";
import { clearScheduledChange } from "./clear-scheduled-change";
import {
  activateFreeSubscription,
} from "./activate-subscription";
import { computeSubscriptionExpiresAt, planNameToEnum } from "./plan-enum";
import type { ActiveSubscriptionRow } from "./get-active-subscription";

/**
 * Apply a scheduled downgrade on an active subscription row whose period has ended.
 */
export async function applyScheduledDowngrade(
  admin: SupabaseClient,
  row: ActiveSubscriptionRow
): Promise<{ applied: boolean; reason?: string }> {
  if (
    row.pending_change_status !== "scheduled" ||
    !row.next_plan_id ||
    !row.change_scheduled_at
  ) {
    return { applied: false, reason: "not_scheduled" };
  }

  const scheduledAt = new Date(row.change_scheduled_at);
  if (scheduledAt.getTime() > Date.now()) {
    return { applied: false, reason: "not_due" };
  }

  const { data: targetPlan, error: planErr } = await admin
    .from("subscription_plans")
    .select("id, name, price, period, is_active")
    .eq("id", row.next_plan_id)
    .maybeSingle();

  if (planErr || !targetPlan) {
    throw new Error(planErr?.message || "Scheduled target plan not found");
  }

  const fromPlanId = row.plan_id;
  const targetPrice = Number(targetPlan.price ?? 0);
  const expiresAt = computeSubscriptionExpiresAt(
    targetPlan.period as string | null
  );

  await admin
    .from("subscriptions")
    .update({
      is_active: false,
      pending_change_status: "applied",
    })
    .eq("id", row.id);

  if (targetPrice <= 0) {
    await activateFreeSubscription(admin, row.pharmacy_id, {
      id: targetPlan.id as string,
      name: String(targetPlan.name),
      period: targetPlan.period as string | null,
      price: 0,
    });
  } else {
    const planEnum = planNameToEnum(String(targetPlan.name));

    await admin
      .from("subscriptions")
      .update({ is_active: false })
      .eq("pharmacy_id", row.pharmacy_id)
      .neq("id", row.id);

    const { data: newSub, error: insertErr } = await admin
      .from("subscriptions")
      .insert({
        pharmacy_id: row.pharmacy_id,
        plan_id: targetPlan.id,
        plan: planEnum,
        is_active: true,
        expires_at: expiresAt.toISOString(),
        payment_method: "scheduled_change",
      })
      .select("id")
      .single();

    if (insertErr || !newSub) {
      throw new Error(insertErr?.message || "Failed to create downgraded subscription");
    }

    await admin
      .from("pharmacies")
      .update({
        subscription_plan: planEnum,
        subscription_expires_at: expiresAt.toISOString(),
        status: "active",
      })
      .eq("id", row.pharmacy_id);
  }

  await clearScheduledChange(admin, row.id);

  await logSubscriptionChangeEvent(admin, {
    pharmacyId: row.pharmacy_id,
    subscriptionId: row.id,
    event: "downgrade_applied",
    fromPlanId,
    toPlanId: targetPlan.id as string,
    metadata: {
      applied_at: new Date().toISOString(),
      new_expires_at: expiresAt.toISOString(),
    },
  });

  return { applied: true };
}
