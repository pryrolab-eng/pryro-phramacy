import { fieldsMatchQuery } from "@/lib/search/match-text";
import type { SaleRow } from "@/lib/http/sales";

export function filterSalesForSearch(
  sales: SaleRow[],
  query: string,
): SaleRow[] {
  const q = query.trim();
  if (!q) return sales;

  return sales.filter((sale) =>
    fieldsMatchQuery(
      [
        sale.customer,
        sale.paymentMethod,
        sale.date,
        sale.status,
        String(sale.amount),
      ],
      q,
    ),
  );
}
