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
 * Uses DB advisory lock via `ensure_pharmacy_hq_branch` to avoid duplicate rows on concurrent requests.
 */
export async function ensureHeadquartersBranch(
  admin: SupabaseClient,
  pharmacyId: string,
): Promise<string | null> {
  const { data: rpcId, error: rpcError } = await admin.rpc(
    "ensure_pharmacy_hq_branch",
    { p_pharmacy_id: pharmacyId },
  );

  if (!rpcError && rpcId) {
    return rpcId as string;
  }

  if (rpcError) {
    console.error("ensureHeadquartersBranch rpc:", rpcError.message);
  }

  return resolveDefaultStockingBranchId(admin, pharmacyId);
}

export function isHeadquartersBranch(
  branch: Pick<BranchRow, "is_headquarters" | "name"> | null | undefined,
): boolean {
  if (!branch) return false;
  if (branch.is_headquarters === true) return true;
  const n = String(branch.name ?? "").toLowerCase();
  return (
    n.includes("headquarters") ||
    n.includes("(hq)") ||
    n.endsWith("— main") ||
    n.endsWith("- main")
  );
}
