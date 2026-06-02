/** Branch rows eligible for the shell switcher and report scope. */

export function dedupeBranchesById<T extends { id: string }>(branches: T[]): T[] {
  const seen = new Set<string>();
  return branches.filter((b) => {
    if (seen.has(b.id)) return false;
    seen.add(b.id);
    return true;
  });
}

export function sortBranchesByCreatedAt<
  T extends { created_at?: string | null },
>(branches: T[]): T[] {
  return [...branches].sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return ta - tb;
  });
}

export function applyStaffBranchFilter<T extends { id: string }>(
  branches: T[],
  allowedBranchIds: string[] | null,
): T[] {
  if (allowedBranchIds === null) return branches;
  const allowed = new Set(allowedBranchIds);
  return branches.filter((b) => allowed.has(b.id));
}

/** Keep oldest active branches up to the subscription slot count. */
export function applyBranchEntitlementLimit<
  T extends { id: string; created_at?: string | null },
>(branches: T[], maxSlots: number): T[] {
  if (maxSlots <= 0) return [];
  const sorted = sortBranchesByCreatedAt(dedupeBranchesById(branches));
  return sorted.slice(0, maxSlots);
}

export function resolveSwitcherBranches<
  T extends { id: string; created_at?: string | null },
>(input: {
  branches: T[];
  maxSlots: number;
  allowedBranchIds: string[] | null;
  activeBranchId: string | null;
  accessBlocked: boolean;
}): T[] {
  let list = dedupeBranchesById(input.branches);
  list = applyStaffBranchFilter(list, input.allowedBranchIds);

  if (input.accessBlocked) {
    if (input.activeBranchId) {
      const active = list.find((b) => b.id === input.activeBranchId);
      if (active) return [active];
    }
    return list.slice(0, 1);
  }

  return applyBranchEntitlementLimit(list, input.maxSlots);
}
