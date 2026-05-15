export type PlatformChartPoint = {
  /** `YYYY-MM` for stable keys */
  key: string;
  /** Full label for tooltips, e.g. "June 2025" */
  month: string;
  /** Compact X-axis label, e.g. "Jun" or "Jun '25" when years differ */
  axisLabel: string;
  revenue: number;
  pharmacies: number;
};

export type PlatformChartRange = 6 | 12;

/** Rolling calendar months for the admin platform chart. */
export function buildPlatformChartSeries(
  pharmacies: Array<{ created_at?: string | null }>,
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    pharmacies: number;
  }>,
  options?: { months?: PlatformChartRange },
): PlatformChartPoint[] {
  const monthCount = options?.months ?? 12;
  const slots: { key: string; date: Date }[] = [];
  const now = new Date();

  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    slots.push({ key, date: d });
  }

  const spanYears =
    new Set(slots.map((s) => String(s.date.getFullYear()))).size > 1;

  const revenueByLabel = new Map<
    string,
    { revenue: number; pharmacies: number }
  >();
  const revenueByKey = new Map<string, { revenue: number; pharmacies: number }>();

  for (const row of revenueByMonth) {
    revenueByLabel.set(row.month, {
      revenue: row.revenue,
      pharmacies: row.pharmacies,
    });
    const parsed = parseYearMonthKey(row.month);
    if (parsed) {
      revenueByKey.set(parsed, {
        revenue: row.revenue,
        pharmacies: row.pharmacies,
      });
    }
  }

  const newPharmaciesByKey = new Map<string, number>();
  for (const p of pharmacies) {
    if (!p.created_at) continue;
    const d = new Date(p.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    newPharmaciesByKey.set(key, (newPharmaciesByKey.get(key) ?? 0) + 1);
  }

  return slots.map(({ key, date }) => {
    const fullLabel = date.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
    const axisLabel = spanYears
      ? date.toLocaleString("en-US", { month: "short", year: "2-digit" })
      : date.toLocaleString("en-US", { month: "short" });

    const fromPayments =
      revenueByKey.get(key) ?? revenueByLabel.get(fullLabel);

    return {
      key,
      month: fullLabel,
      axisLabel,
      revenue: fromPayments?.revenue ?? 0,
      pharmacies:
        fromPayments?.pharmacies ?? newPharmaciesByKey.get(key) ?? 0,
    };
  });
}

function parseYearMonthKey(monthLabel: string): string | null {
  const d = new Date(`${monthLabel} 1`);
  if (!Number.isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  const withYear = new Date(`1 ${monthLabel}`);
  if (!Number.isNaN(withYear.getTime())) {
    return `${withYear.getFullYear()}-${String(withYear.getMonth() + 1).padStart(2, "0")}`;
  }
  return null;
}
