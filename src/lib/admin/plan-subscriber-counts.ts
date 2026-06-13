import { storeCountActiveSubscribersByPlanId } from "@/lib/db/admin-store";

/** Active subscription counts per catalog plan id (with legacy name fallback). */
export async function countActiveSubscribersByPlanId(): Promise<{
  byPlanId: Map<string, number>;
  byPlanName: Map<string, number>;
}> {
  return storeCountActiveSubscribersByPlanId();
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
