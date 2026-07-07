import type { SaasBranchWithUsage } from "@/lib/http/saas-branches";
import { fieldsMatchQuery } from "@/lib/search/match-text";

export function filterBranchesForSearch(
  branches: SaasBranchWithUsage[],
  query: string,
): SaasBranchWithUsage[] {
  const q = query.trim();
  if (!q) return branches;
  return branches.filter((branch) =>
    fieldsMatchQuery(
      [branch.name, branch.address, branch.phone, branch.email],
      q,
    ),
  );
}
