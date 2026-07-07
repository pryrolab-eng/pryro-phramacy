"use client";

import { useMemo } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { SEARCH_DEBOUNCE_MS } from "@/lib/search/constants";

/**
 * Filter a cached list locally with debounce — no API call per keystroke.
 * Pass `undefined` items while the list query is still loading.
 */
export function useLocalListSearch<T>(
  query: string,
  items: T[] | undefined,
  filterFn: (items: T[], debouncedQuery: string) => T[],
) {
  const trimmed = query.trim();
  const debouncedQuery = useDebouncedValue(trimmed, SEARCH_DEBOUNCE_MS);
  const isDebouncing = trimmed !== debouncedQuery;

  const filtered = useMemo(() => {
    if (items === undefined) return [];
    if (!debouncedQuery) return items;
    return filterFn(items, debouncedQuery);
  }, [items, debouncedQuery, filterFn]);

  return {
    filtered,
    debouncedQuery,
    isDebouncing,
    isPending: items === undefined,
  };
}
