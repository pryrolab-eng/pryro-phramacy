import type { SupabaseClient } from "@supabase/supabase-js";
import { subscriptionPlanEnumForApi } from "@/lib/admin/plan-stats";
import { planNameToEnum } from "@/lib/subscription/plan-enum";

/** Map admin plan picker value (catalog:id or enum) to pharmacies.subscription_plan. */
export async function resolveSubscriptionPlanEnum(
  admin: SupabaseClient,
  planValue: string | null | undefined,
): Promise<"trial" | "standard" | "premium"> {
  const raw = String(planValue ?? "").trim();
  if (raw.startsWith("catalog:")) {
    const id = raw.slice("catalog:".length);
    const { data } = await admin
      .from("subscription_plans")
      .select("name")
      .eq("id", id)
      .maybeSingle();
    if (data?.name) {
      return planNameToEnum(String(data.name));
    }
  }
  const mapped = subscriptionPlanEnumForApi(raw);
  if (mapped.startsWith("catalog:")) {
    return "trial";
  }
  return planNameToEnum(mapped) as "trial" | "standard" | "premium";
}
