import type { SupabaseClient } from "@supabase/supabase-js";
import { REQUIRED_MAIN_PLAN_FEATURE_KEYS } from "./feature-catalog";

export type PlatformFeatureRow = {
  key: string;
  display_name: string;
  description: string | null;
  group: string;
  feature_type: "boolean" | "limit" | "metered";
  limit_column: string | null;
  nav_routes: string[];
  api_routes: unknown;
  sort_order: number;
  is_active: boolean;
};

export async function listPlatformFeatures(
  admin: SupabaseClient,
  options?: { includeInactive?: boolean },
): Promise<PlatformFeatureRow[]> {
  let q = admin
    .from("platform_features")
    .select("*")
    .order("group")
    .order("sort_order");
  if (!options?.includeInactive) {
    q = q.eq("is_active", true);
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    key: row.key as string,
    display_name: row.display_name as string,
    description: (row.description as string | null) ?? null,
    group: row.group as string,
    feature_type: row.feature_type as PlatformFeatureRow["feature_type"],
    limit_column: (row.limit_column as string | null) ?? null,
    nav_routes: (row.nav_routes as string[]) ?? [],
    api_routes: row.api_routes,
    sort_order: Number(row.sort_order ?? 0),
    is_active: Boolean(row.is_active),
  }));
}

export async function loadPlanFeatureKeys(
  admin: SupabaseClient,
  planId: string,
): Promise<string[]> {
  const { data, error } = await admin
    .from("plan_features")
    .select("feature_key")
    .eq("plan_id", planId)
    .eq("enabled", true);

  if (error) throw new Error(error.message);

  const keys = (data ?? []).map((row) => row.feature_key as string);
  if (keys.length === 0) return [];

  const { data: meta, error: metaErr } = await admin
    .from("platform_features")
    .select("key, feature_type")
    .in("key", keys);
  if (metaErr) {
    console.warn(
      "loadPlanFeatureKeys: platform_features lookup failed, using plan keys as-is:",
      metaErr.message,
    );
    return keys;
  }

  const booleanKeys = new Set(
    (meta ?? [])
      .filter((r) => r.feature_type === "boolean")
      .map((r) => r.key as string),
  );
  return keys.filter((k) => booleanKeys.has(k));
}

export async function syncPlanFeatures(
  admin: SupabaseClient,
  planId: string,
  featureKeys: string[],
): Promise<void> {
  const unique = Array.from(new Set(featureKeys.filter(Boolean)));

  const { data: booleanFeatures, error: bfErr } = await admin
    .from("platform_features")
    .select("key")
    .eq("feature_type", "boolean")
    .in("key", unique.length ? unique : ["__none__"]);

  if (bfErr) throw new Error(bfErr.message);

  const validKeys = new Set((booleanFeatures ?? []).map((r) => r.key as string));
  const toInsert = unique.filter((k) => validKeys.has(k));

  const { error: delErr } = await admin
    .from("plan_features")
    .delete()
    .eq("plan_id", planId);
  if (delErr) throw new Error(delErr.message);

  if (toInsert.length === 0) return;

  const { data: labelRows, error: labelErr } = await admin
    .from("platform_features")
    .select("key, display_name")
    .in("key", toInsert);
  if (labelErr) throw new Error(labelErr.message);

  const labelByKey = new Map(
    (labelRows ?? []).map((r) => [r.key as string, r.display_name as string]),
  );

  const { error: insErr } = await admin.from("plan_features").insert(
    toInsert.map((feature_key) => ({
      plan_id: planId,
      feature_key,
      feature_label: labelByKey.get(feature_key) ?? feature_key,
      enabled: true,
    })),
  );
  if (insErr) throw new Error(insErr.message);
}

export async function displayNamesForFeatureKeys(
  admin: SupabaseClient,
  keys: string[],
): Promise<string[]> {
  if (keys.length === 0) return [];
  const { data, error } = await admin
    .from("platform_features")
    .select("key, display_name, sort_order")
    .in("key", keys)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.display_name as string);
}

export async function syncPlanMarketingFeatures(
  admin: SupabaseClient,
  planId: string,
  featureKeys: string[],
): Promise<string[]> {
  const labels = await displayNamesForFeatureKeys(admin, featureKeys);
  const { error } = await admin
    .from("subscription_plans")
    .update({ features: labels })
    .eq("id", planId);
  if (error) throw new Error(error.message);
  return labels;
}

export function validateRequiredMainPlanKeys(featureKeys: string[]): string | null {
  for (const required of REQUIRED_MAIN_PLAN_FEATURE_KEYS) {
    if (!featureKeys.includes(required)) {
      return `Main plans must include feature: ${required}`;
    }
  }
  return null;
}

/** Map legacy marketing strings to catalog keys (best effort). */
export function legacyFeatureTextToKeys(textFeatures: string[]): string[] {
  const keys = new Set<string>();
  const lower = textFeatures.map((f) => f.toLowerCase());

  if (lower.some((f) => f.includes("pos"))) keys.add("pos.access");
  if (lower.some((f) => f.includes("report"))) keys.add("reports.view");
  if (lower.some((f) => f.includes("insurance"))) keys.add("pos.insurance");
  if (lower.some((f) => f.includes("user"))) keys.add("staff.invite");
  if (lower.some((f) => f.includes("analytic"))) keys.add("inventory.analytics");
  if (lower.some((f) => f.includes("integration"))) keys.add("pos.insurance");

  keys.add("app.dashboard");
  keys.add("inventory.access");
  keys.add("customers.access");
  keys.add("settings.access");
  keys.add("billing.self_serve");
  keys.add("limit.users");
  keys.add("limit.branches");
  keys.add("limit.transactions_per_branch");

  return Array.from(keys);
}
