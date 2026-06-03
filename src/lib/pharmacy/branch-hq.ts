import type { SupabaseClient } from "@supabase/supabase-js";

/** Default name for the auto-provisioned distribution site (not a satellite branch). */
export const HEADQUARTERS_BRANCH_NAME = "Headquarters (HQ)";

export type BranchRow = {
  id: string;
  name?: string;
  is_headquarters?: boolean;
  is_active?: boolean;
};

/** Active HQ branch id for a pharmacy, if any. */
export async function resolveHeadquartersBranchId(
  admin: SupabaseClient,
  pharmacyId: string,
): Promise<string | null> {
  const { data } = await admin
    .from("branches")
    .select("id")
    .eq("pharmacy_id", pharmacyId)
    .eq("is_active", true)
    .eq("is_headquarters", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (data?.id as string) ?? null;
}

/** Preferred stocking location: HQ first, else oldest active branch. */
export async function resolveDefaultStockingBranchId(
  admin: SupabaseClient,
  pharmacyId: string,
): Promise<string | null> {
  const hq = await resolveHeadquartersBranchId(admin, pharmacyId);
  if (hq) return hq;

  const { data } = await admin
    .from("branches")
    .select("id")
    .eq("pharmacy_id", pharmacyId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (data?.id as string) ?? null;
}

/**
 * Ensures exactly one HQ exists for POS/inventory when a pharmacy has no locations yet.
 * Satellite branches are added later via Branches (plan slots) and stocked by transfer from HQ.
 */
export async function ensureHeadquartersBranch(
  admin: SupabaseClient,
  pharmacyId: string,
): Promise<string | null> {
  const existing = await resolveDefaultStockingBranchId(admin, pharmacyId);
  if (existing) return existing;

  const { count } = await admin
    .from("branches")
    .select("id", { count: "exact", head: true })
    .eq("pharmacy_id", pharmacyId);

  if ((count ?? 0) > 0) {
    return resolveDefaultStockingBranchId(admin, pharmacyId);
  }

  const { data: pharmacy } = await admin
    .from("pharmacies")
    .select("name, address, phone, email")
    .eq("id", pharmacyId)
    .maybeSingle();

  const { data: branch, error } = await admin
    .from("branches")
    .insert({
      pharmacy_id: pharmacyId,
      name: HEADQUARTERS_BRANCH_NAME,
      address: pharmacy?.address ?? null,
      phone: pharmacy?.phone ?? null,
      email: pharmacy?.email ?? null,
      is_active: true,
      is_headquarters: true,
    })
    .select("id")
    .single();

  if (error) {
    console.error("ensureHeadquartersBranch:", error.message);
    return resolveDefaultStockingBranchId(admin, pharmacyId);
  }

  return (branch?.id as string) ?? null;
}

export function isHeadquartersBranch(
  branch: Pick<BranchRow, "is_headquarters" | "name"> | null | undefined,
): boolean {
  if (!branch) return false;
  if (branch.is_headquarters === true) return true;
  const n = String(branch.name ?? "").toLowerCase();
  return n.includes("headquarters") || n.includes("(hq)");
}
