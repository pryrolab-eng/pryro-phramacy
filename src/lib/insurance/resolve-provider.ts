import type { SupabaseClient } from "@supabase/supabase-js";

/** Resolve provider by UUID or display name (global or pharmacy-scoped). */
export async function resolveInsuranceProvider(
  admin: SupabaseClient,
  pharmacyId: string,
  providerIdOrName: string,
): Promise<{
  id: string;
  name: string;
  coveragePercent: number;
  integrationType: string;
} | null> {
  const key = providerIdOrName.trim();
  if (!key) return null;

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      key,
    );

  let query = admin
    .from("insurance_providers")
    .select(
      "id, name, coverage_percentage, default_coverage_percent, integration_type",
    )
    .eq("is_active", true);

  if (isUuid) {
    query = query.eq("id", key);
  } else {
    query = query.ilike("name", key);
  }

  const { data, error } = await query
    .or(`pharmacy_id.eq.${pharmacyId},pharmacy_id.is.null`)
    .limit(5);

  if (error) throw new Error(error.message);

  const row = (data ?? [])[0];
  if (!row) return null;

  const pct = Number(
    row.default_coverage_percent ?? row.coverage_percentage ?? 0,
  );

  return {
    id: row.id as string,
    name: row.name as string,
    coveragePercent: pct,
    integrationType: (row.integration_type as string) ?? "manual",
  };
}

/** Platform admin: resolve a global insurer (pharmacy_id is null). */
export async function resolveGlobalInsuranceProvider(
  admin: SupabaseClient,
  providerIdOrName: string,
): Promise<{
  id: string;
  name: string;
  coveragePercent: number;
  integrationType: string;
} | null> {
  const key = providerIdOrName.trim();
  if (!key) return null;

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      key,
    );

  let query = admin
    .from("insurance_providers")
    .select(
      "id, name, coverage_percentage, default_coverage_percent, integration_type",
    )
    .eq("is_active", true)
    .is("pharmacy_id", null);

  if (isUuid) {
    query = query.eq("id", key);
  } else {
    query = query.ilike("name", key);
  }

  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const pct = Number(
    data.default_coverage_percent ?? data.coverage_percentage ?? 0,
  );

  return {
    id: data.id as string,
    name: data.name as string,
    coveragePercent: pct,
    integrationType: (data.integration_type as string) ?? "manual",
  };
}

