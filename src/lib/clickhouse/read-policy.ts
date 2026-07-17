/**
 * What reads ClickHouse vs Postgres.
 *
 * ClickHouse (analytics GETs — aggregates, charts, reports):
 *   - dashboard sales totals / monthly revenue / today sales
 *   - sales chart, weekly sales, category sales
 *   - sales report daily totals + top products
 *
 * Postgres (operational GETs — must be live / transactional):
 *   - POS products & live stock
 *   - inventory list / adjustments
 *   - recent sales list (receipt detail)
 *   - stock alerts / inventory chart (until inventory snapshots in CH)
 *   - auth, staff, customers, prescriptions, me/context
 */

import { isClickHouseConfigured } from "./client";

/** Prefer CH when URL is set. Always fall back to Postgres on error. */
export function shouldPreferClickHouseReads(): boolean {
  return isClickHouseConfigured();
}
