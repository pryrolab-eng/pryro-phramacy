import { subscriptionPlanEnumForApi } from "@/lib/admin/plan-stats";
import { storeGetSubscriptionPlanNameById } from "@/lib/db/admin-store";
import { planNameToEnum } from "@/lib/subscription/plan-enum";

/** Map admin plan picker value (catalog:id or enum) to pharmacies.subscription_plan. */
export async function resolveSubscriptionPlanEnum(
  planValue: string | null | undefined,
): Promise<"trial" | "standard" | "premium"> {
  const raw = String(planValue ?? "").trim();
  if (raw.startsWith("catalog:")) {
    const id = raw.slice("catalog:".length);
    const name = await storeGetSubscriptionPlanNameById(id);
    if (name) {
      return planNameToEnum(name);
    }
  }
  const mapped = subscriptionPlanEnumForApi(raw);
  if (mapped.startsWith("catalog:")) {
    return "trial";
  }
  return planNameToEnum(mapped) as "trial" | "standard" | "premium";
}
