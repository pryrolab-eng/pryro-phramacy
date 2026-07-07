/** Case-insensitive substring match. */
export function textMatchesQuery(
  value: string | null | undefined,
  query: string,
): boolean {
  if (!value?.trim() || !query.trim()) return false;
  return value.toLowerCase().includes(query.trim().toLowerCase());
}

/** True when any field contains the query (case-insensitive). */
export function fieldsMatchQuery(
  fields: Array<string | null | undefined>,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return fields.some((field) => field?.toLowerCase().includes(q));
}
