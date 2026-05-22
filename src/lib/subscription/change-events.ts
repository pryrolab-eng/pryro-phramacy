import type { SupabaseClient } from "@supabase/supabase-js";

export type SubscriptionChangeEventType =
  | "downgrade_scheduled"
  | "downgrade_applied"
  | "downgrade_canceled";

export async function logSubscriptionChangeEvent(
  admin: SupabaseClient,
  params: {
    pharmacyId: string;
    subscriptionId?: string | null;
    event: SubscriptionChangeEventType;
    fromPlanId?: string | null;
    toPlanId?: string | null;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const { error } = await admin.from("subscription_change_events").insert({
    pharmacy_id: params.pharmacyId,
    subscription_id: params.subscriptionId ?? null,
    event: params.event,
    from_plan_id: params.fromPlanId ?? null,
    to_plan_id: params.toPlanId ?? null,
    metadata: params.metadata ?? {},
  });

  if (error) {
    console.warn("subscription_change_events insert:", error.message);
  }
}
