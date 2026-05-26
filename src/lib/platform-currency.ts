/** Platform billing currency (default RWF). Set via env — not hardcoded in UI. */
export function getPlatformCurrency(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_PLATFORM_CURRENCY?.trim() ||
    process.env.PLATFORM_CURRENCY?.trim();
  return (fromEnv || "RWF").toUpperCase();
}

export function normalizeCurrency(code: string | null | undefined): string {
  const trimmed = code?.trim();
  if (!trimmed) return getPlatformCurrency();
  return trimmed.toUpperCase();
}

export function formatMoney(
  amount: number,
  currency?: string | null,
): string {
  const c = normalizeCurrency(currency);
  return `${amount.toLocaleString()} ${c}`;
}

export function isPlatformCurrency(code: string | null | undefined): boolean {
  return normalizeCurrency(code) === getPlatformCurrency();
}
