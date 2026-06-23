import { prisma } from "@/lib/db/prisma";

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
  pharmacyId: string,
): Promise<string | null> {
  const row = await prisma.branches.findFirst({
    where: {
      pharmacy_id: pharmacyId,
      is_active: true,
      is_headquarters: true,
    },
    orderBy: { created_at: "asc" },
    select: { id: true },
  });

  return row?.id ?? null;
}

/** Preferred stocking location: HQ first, else oldest active branch. */
export async function resolveDefaultStockingBranchId(
  pharmacyId: string,
): Promise<string | null> {
  const hq = await resolveHeadquartersBranchId(pharmacyId);
  if (hq) return hq;

  const row = await prisma.branches.findFirst({
    where: { pharmacy_id: pharmacyId, is_active: true },
    orderBy: { created_at: "asc" },
    select: { id: true },
  });

  return row?.id ?? null;
}

/**
 * Ensures exactly one HQ exists for POS/inventory when a pharmacy has no locations yet.
 * Uses DB advisory lock via `ensure_pharmacy_hq_branch` to avoid duplicate rows on concurrent requests.
 */
export async function ensureHeadquartersBranch(
  pharmacyId: string,
): Promise<string | null> {
  try {
    const rows = await prisma.$queryRaw<
      [{ ensure_pharmacy_hq_branch: string | null }]
    >`
      SELECT ensure_pharmacy_hq_branch(${pharmacyId}::uuid) AS ensure_pharmacy_hq_branch
    `;
    const id = rows[0]?.ensure_pharmacy_hq_branch;
    if (id) return id;
  } catch (error) {
    console.error(
      "ensureHeadquartersBranch rpc:",
      error instanceof Error ? error.message : error,
    );
  }

  return resolveDefaultStockingBranchId(pharmacyId);
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
