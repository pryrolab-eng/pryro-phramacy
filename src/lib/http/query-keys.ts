/**
 * Shared helpers for React Query cache keys.
 * Each domain module should export a `*Keys` object, e.g. pharmacyDashboardKeys.
 */

export function domainKey(domain: string) {
  return [domain] as const;
}

export function listKey<T extends readonly unknown[]>(base: T) {
  return [...base, "list"] as const;
}

export function detailKey<T extends readonly unknown[]>(base: T, id: string) {
  return [...base, "detail", id] as const;
}
