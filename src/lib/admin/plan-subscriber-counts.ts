import type { SupabaseClient } from "@supabase/supabase-js";

/** Active subscription counts per catalog plan id (with legacy name fallback). */
export async function countActiveSubscribersByPlanId(
  db: SupabaseClient,
): Promise<{ byPlanId: Map<string, number>; byPlanName: Map<string, number> }> {
  const { data: subs, error } = await db
    .from("subscriptions")
    .select("plan_id, plan, status, is_active")
    .eq("is_active", true);

  if (error) throw error;

  const byPlanId = new Map<string, number>();
  const byPlanName = new Map<string, number>();

  for (const row of subs ?? []) {
    const status = String((row as { status?: string }).status ?? "");
    if (status === "canceled" || status === "expired") continue;

    const planId = (row as { plan_id?: string | null }).plan_id;
    if (planId) {
      byPlanId.set(planId, (byPlanId.get(planId) ?? 0) + 1);
      continue;
    }
    const name = String((row as { plan?: string | null }).plan ?? "unknown")
      .trim()
      .toLowerCase();
    byPlanName.set(name, (byPlanName.get(name) ?? 0) + 1);
  }

  return { byPlanId, byPlanName };
}

export function subscriberCountForPlan(
  plan: { id: string; name?: string },
  counts: { byPlanId: Map<string, number>; byPlanName: Map<string, number> },
): number {
  const fromId = counts.byPlanId.get(plan.id);
  if (fromId != null) return fromId;
  const name = String(plan.name ?? "").trim().toLowerCase();
  return counts.byPlanName.get(name) ?? 0;
}
