/**
 * Shared React Query defaults for platform admin reads.
 * Keeps cached list data across /admin navigation; mutations still invalidate.
 */
export const ADMIN_LIST_STALE_MS = 5 * 60 * 1000;
export const ADMIN_DETAIL_STALE_MS = 2 * 60 * 1000;
export const ADMIN_QUERY_GC_MS = 30 * 60 * 1000;

/** List/catalog admin queries (pharmacies, plans, billing, reports, …). */
export const adminListQueryDefaults = {
  staleTime: ADMIN_LIST_STALE_MS,
  gcTime: ADMIN_QUERY_GC_MS,
  refetchOnWindowFocus: false,
  /** Use cache when revisiting a page; refetch via Refresh or invalidation. */
  refetchOnMount: false,
} as const;

/** Per-entity detail (e.g. pharmacy detail dialog). */
export const adminDetailQueryDefaults = {
  staleTime: ADMIN_DETAIL_STALE_MS,
  gcTime: ADMIN_QUERY_GC_MS,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
} as const;
