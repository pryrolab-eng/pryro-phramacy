import type { SupabaseClient } from "@supabase/supabase-js";

/** Plan label for UI (lowercase name, e.g. standard, premium, basic). */
export async function getEffectiveSubscriptionLabel(
  supabase: SupabaseClient,
  pharmacyId: string,
  pharmacyPlanFallback?: string | null
): Promise<string> {
  const { data: activeSub } = await supabase
    .from("subscriptions")
    .select(
      `
      plan,
      subscription_plans ( name )
    `
    )
    .eq("pharmacy_id", pharmacyId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeSub) {
    const joined = activeSub.subscription_plans as
      | { name?: string }
      | { name?: string }[]
      | null;
    const catalogName = Array.isArray(joined)
      ? joined[0]?.name
      : joined?.name;
    if (catalogName) {
      return catalogName.toLowerCase();
    }
    return String(activeSub.plan ?? "trial").toLowerCase();
  }

  return (pharmacyPlanFallback || "standard").toLowerCase();
}
