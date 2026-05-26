/** Supabase join relations may return a single object or an array depending on the query. */
export function firstRelation<T>(value: T | T[] | null | undefined): T | undefined {
  if (value == null) return undefined
  return Array.isArray(value) ? value[0] : value
}
