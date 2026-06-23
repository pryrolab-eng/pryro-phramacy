import {
  resolveActivePharmacyContext,
  type ActivePharmacyContext,
} from "@/lib/pharmacy/active-pharmacy";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { storeGetUserActiveContext } from "@/lib/db/public-users-store";
import { storeFindMembershipAtPharmacy } from "@/lib/db/pharmacy-users-store";
import { prisma } from "@/lib/db/prisma";

export async function resolveSessionBranchContext(
  userId: string,
): Promise<ActivePharmacyContext> {
  return resolveActivePharmacyContext(userId);
}

/** Prisma-first active branch for the current user. */
export async function requireUserBranchId(userId: string): Promise<string> {
  const pharmacyId = await requireUserPharmacyId(userId);
  const ctx = await storeGetUserActiveContext(userId);

  if (ctx?.active_branch_id) {
    const branch = await prisma.branches.findFirst({
      where: {
        id: ctx.active_branch_id,
        pharmacy_id: pharmacyId,
        is_active: { not: false },
      },
      select: { id: true },
    });
    if (branch) return branch.id;
  }

  const hq = await prisma.branches.findFirst({
    where: {
      pharmacy_id: pharmacyId,
      OR: [{ is_headquarters: true }, { is_main_branch: true }],
      is_active: { not: false },
    },
    orderBy: { created_at: "asc" },
    select: { id: true },
  });

  if (hq) return hq.id;

  const first = await prisma.branches.findFirst({
    where: { pharmacy_id: pharmacyId, is_active: { not: false } },
    orderBy: { created_at: "asc" },
    select: { id: true },
  });

  if (!first) {
    throw new Error("No active branch. Select a branch in the top bar.");
  }

  return first.id;
}

/** Active branch within the active pharmacy, or throws. */
export async function requireSessionBranchId(userId: string): Promise<string> {
  return requireUserBranchId(userId);
}
