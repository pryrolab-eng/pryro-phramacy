import type { SupabaseClient } from "@supabase/supabase-js";
import { SUBSCRIPTION_CURRENT_PLAN_EMBED } from "./embed-plan";

export type ActiveSubscriptionRow = {
  id: string;
  pharmacy_id: string;
  plan_id: string | null;
  plan: string;
  expires_at: string | null;
  is_active: boolean;
  next_plan_id: string | null;
  change_scheduled_at: string | null;
  change_type: string | null;
  pending_change_status: string | null;
  subscription_plans?: {
    id: string;
    name: string;
    price: number | string;
    period?: string | null;
  } | {
    id: string;
    name: string;
    price: number | string;
    period?: string | null;
  }[] | null;
};

export async function getActiveSubscription(
  admin: SupabaseClient,
  pharmacyId: string
): Promise<ActiveSubscriptionRow | null> {
  const { data, error } = await admin
    .from("subscriptions")
    .select(
      `
      id,
      pharmacy_id,
      plan_id,
      plan,
      expires_at,
      is_active,
      next_plan_id,
      change_scheduled_at,
      change_type,
      pending_change_status,
      ${SUBSCRIPTION_CURRENT_PLAN_EMBED} ( id, name, price, period )
    `
    )
    .eq("pharmacy_id", pharmacyId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as ActiveSubscriptionRow | null;
}

export function resolveJoinedPlan(
  row: ActiveSubscriptionRow
): { id: string; name: string; price: number; period?: string | null } | null {
  const joined = row.subscription_plans;
  if (!joined) return null;
  const plan = Array.isArray(joined) ? joined[0] : joined;
  if (!plan?.id) return null;
  return {
    id: plan.id,
    name: String(plan.name),
    price: Number(plan.price ?? 0),
    period: plan.period ?? null,
  };
}
