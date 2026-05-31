import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { MIN_GLOBAL_SEARCH_LENGTH } from "@/lib/search/escape-ilike";
import { searchAdminData, searchPharmacyData } from "@/lib/http/search";
import type {
  AdminGlobalSearchResult,
  PharmacyGlobalSearchResult,
} from "@/lib/search/types";

const SEARCH_DEBOUNCE_MS = 300;

export const pharmacySearchKeys = {
  all: ["global-search", "pharmacy"] as const,
  query: (q: string) => [...pharmacySearchKeys.all, q] as const,
};

export const adminSearchKeys = {
  all: ["global-search", "admin"] as const,
  query: (q: string) => [...adminSearchKeys.all, q] as const,
};

type GlobalSearchQuery<T> = UseQueryResult<T> & {
  /** True while the typed query is ahead of the debounced fetch query. */
  isDebouncing: boolean;
};

export function usePharmacyGlobalSearch(
  query: string,
  enabled = true,
): GlobalSearchQuery<PharmacyGlobalSearchResult> {
  const trimmed = query.trim();
  const debouncedQuery = useDebouncedValue(trimmed, SEARCH_DEBOUNCE_MS);
  const isDebouncing =
    enabled &&
    trimmed.length >= MIN_GLOBAL_SEARCH_LENGTH &&
    trimmed !== debouncedQuery;

  const result = useQuery({
    queryKey: pharmacySearchKeys.query(debouncedQuery),
    queryFn: () => searchPharmacyData(debouncedQuery),
    enabled: enabled && debouncedQuery.length >= MIN_GLOBAL_SEARCH_LENGTH,
    staleTime: 20_000,
  });

  return { ...result, isDebouncing };
}

export function useAdminGlobalSearch(
  query: string,
  enabled = true,
): GlobalSearchQuery<AdminGlobalSearchResult> {
  const trimmed = query.trim();
  const debouncedQuery = useDebouncedValue(trimmed, SEARCH_DEBOUNCE_MS);
  const isDebouncing =
    enabled &&
    trimmed.length >= MIN_GLOBAL_SEARCH_LENGTH &&
    trimmed !== debouncedQuery;

  const result = useQuery({
    queryKey: adminSearchKeys.query(debouncedQuery),
    queryFn: () => searchAdminData(debouncedQuery),
    enabled: enabled && debouncedQuery.length >= MIN_GLOBAL_SEARCH_LENGTH,
    staleTime: 20_000,
  });

  return { ...result, isDebouncing };
}
