/** Strip characters that break PostgREST `ilike` patterns or `.or()` clauses. */
export function escapeIlikePattern(raw: string): string {
  return raw.replace(/[%_,()]/g, " ").trim();
}

export const MIN_GLOBAL_SEARCH_LENGTH = 2;
