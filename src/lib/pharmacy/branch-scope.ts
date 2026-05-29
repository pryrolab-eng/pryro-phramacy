export type BranchScopeQuery = {
  branchId?: string;
  from?: string;
  to?: string;
};

export function buildBranchScopeQueryString(scope: BranchScopeQuery): string {
  const params = new URLSearchParams();
  if (scope.branchId) params.set("branchId", scope.branchId);
  if (scope.from) params.set("from", scope.from);
  if (scope.to) params.set("to", scope.to);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function parseBranchScopeFromRequest(
  request: Request,
): BranchScopeQuery {
  const url = new URL(request.url);
  const branchId = url.searchParams.get("branchId") ?? undefined;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  return {
    branchId: branchId && branchId !== "all" ? branchId : undefined,
    from,
    to,
  };
}

export function defaultReportRange(days = 30): { from: string; to: string } {
  const to = new Date();
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

/** Stable React Query key parts — avoid embedding rolling ISO timestamps. */
export function branchScopeCacheKey(
  branchId: string | undefined,
  days: number,
): readonly [string, number] {
  return [branchId ?? "all", days] as const;
}
