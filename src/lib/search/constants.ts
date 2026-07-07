/** Debounce before running a search (keystrokes settle). */
export const SEARCH_DEBOUNCE_MS = 300;

/** How long list caches stay fresh before background refetch. */
export const SEARCH_LIST_STALE_MS = 5 * 60_000;

export { MIN_GLOBAL_SEARCH_LENGTH as MIN_SEARCH_LENGTH } from "@/lib/search/escape-ilike";
