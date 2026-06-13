/** Query params that must never appear in auth page URLs (logs, history, referrers). */
export const SENSITIVE_AUTH_QUERY_PARAMS = [
  "password",
  "passwd",
  "pwd",
  "pass",
  "token",
  "access_token",
  "refresh_token",
  "secret",
] as const;

export function stripSensitiveAuthQueryParams(
  searchParams: URLSearchParams,
): { sanitized: URLSearchParams; removed: string[] } {
  const sanitized = new URLSearchParams(searchParams);
  const removed: string[] = [];

  for (const key of SENSITIVE_AUTH_QUERY_PARAMS) {
    if (sanitized.has(key)) {
      removed.push(key);
      sanitized.delete(key);
    }
  }

  return { sanitized, removed };
}

export function hasSensitiveAuthQueryParams(
  searchParams: URLSearchParams,
): boolean {
  return SENSITIVE_AUTH_QUERY_PARAMS.some((key) => searchParams.has(key));
}
