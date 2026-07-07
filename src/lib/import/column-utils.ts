/** Match spreadsheet headers case-insensitively with optional aliases. */
export function pickColumn(
  row: Record<string, unknown>,
  aliases: string[],
): string {
  const normalized = new Map<string, string>();
  for (const key of Object.keys(row)) {
    normalized.set(key.trim().toLowerCase(), key);
  }

  for (const alias of aliases) {
    const exact = normalized.get(alias.trim().toLowerCase());
    if (exact != null) {
      const value = row[exact];
      if (value != null && String(value).trim() !== "") {
        return String(value).trim();
      }
    }
  }

  for (const alias of aliases) {
    const needle = alias.trim().toLowerCase();
    for (const [lower, original] of Array.from(normalized.entries())) {
      if (lower.includes(needle) || needle.includes(lower)) {
        const value = row[original];
        if (value != null && String(value).trim() !== "") {
          return String(value).trim();
        }
      }
    }
  }

  return "";
}

export function pickNumber(
  row: Record<string, unknown>,
  aliases: string[],
): number | null {
  const raw = pickColumn(row, aliases);
  if (!raw) return null;
  const value = Number(raw.replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}
