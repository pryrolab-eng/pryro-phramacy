import type { payment_method } from "@prisma/client";

export type SalesReportRow = {
  total_amount: number;
  created_at: string;
  id: string;
  customer_name: string | null;
  payment_method: payment_method | null;
};

export function aggregateRevenueByPaymentMethod(rows: SalesReportRow[]) {
  const buckets: Record<string, number> = {
    cash: 0,
    card: 0,
    mobile_money: 0,
    insurance: 0,
    mixed: 0,
  };

  let totalSales = 0;
  for (const row of rows) {
    totalSales += row.total_amount;
    const method = row.payment_method ?? "cash";
    if (method in buckets) {
      buckets[method] += row.total_amount;
    } else {
      buckets.cash += row.total_amount;
    }
  }

  return {
    totalSales,
    cashSales: buckets.cash,
    cardSales: buckets.card,
    mobileMoneySales: buckets.mobile_money,
    insuranceSales: buckets.insurance,
    mixedSales: buckets.mixed,
  };
}

export function formatReportPeriod(range: { from: string; to: string }): string {
  const from = new Date(range.from);
  const to = new Date(range.to);
  return `${from.toLocaleDateString()} – ${to.toLocaleDateString()}`;
}

const VAT_RATE = 0.18;

export function buildTaxSummary(totalSales: number) {
  const vatableSales = totalSales;
  const vatAmount = Math.round(vatableSales * VAT_RATE);
  return {
    totalSales,
    vatableSales,
    vatAmount,
    vatRate: VAT_RATE * 100,
  };
}
