import {
  buildCategorySalesChart,
  buildInventoryAlertsReport,
  buildInventoryChart,
  buildMonthlySalesChart,
  buildPharmacyDashboardStats,
  buildSalesReportPayload,
  buildWeeklySalesChart,
} from "@/lib/reports/aggregates";
import {
  countActiveStaffForPharmacy,
  countMedicationsForPharmacy,
  fetchCategorySaleItemRows,
  fetchInventoryChartRows,
  fetchInventoryReportRows,
  fetchLegacyDashboardStats,
  fetchLegacyInventoryAlerts,
  fetchRangeSalesRows,
  fetchRecentSalesWithItems,
  fetchSaleItemsReportRows,
  fetchSalesReportRows,
  fetchSalesSince,
  fetchTodaySalesTotal,
  fetchWeeklySaleItemRows,
  type ReportScope,
} from "@/lib/db/reports";
import { shouldPreferClickHouseReads } from "@/lib/clickhouse/read-policy";
import {
  queryCategorySalesChart,
  queryMonthlySalesChart,
  querySalesReport,
  queryTodaySalesTotal,
  queryDashboardSalesTotals,
  queryWeeklySalesChart,
  queryActiveCustomerCount,
} from "@/lib/clickhouse/queries";

async function withClickHouseFallback<T>(
  label: string,
  chFn: () => Promise<T>,
  pgFn: () => Promise<T>,
): Promise<T> {
  if (!shouldPreferClickHouseReads()) return pgFn();
  try {
    return await chFn();
  } catch (err) {
    console.warn(`[clickhouse] ${label} failed, using Postgres`, err);
    return pgFn();
  }
}

export async function storeGetSalesReport(
  scope: ReportScope,
  range: { from: string; to: string },
) {
  return withClickHouseFallback(
    "sales-report",
    () =>
      querySalesReport(
        { pharmacyId: scope.pharmacyId, branchId: scope.branchId },
        range,
      ),
    async () => {
      const [salesData, topProductsData] = await Promise.all([
        fetchSalesReportRows(scope, range),
        fetchSaleItemsReportRows(scope, range),
      ]);
      return {
        ...buildSalesReportPayload(salesData, topProductsData),
        branchId: scope.branchId ?? null,
      };
    },
  );
}

export async function storeGetInventoryReport(pharmacyId: string) {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const rows = await fetchInventoryReportRows(pharmacyId, since);
  return { inventoryAlerts: buildInventoryAlertsReport(rows) };
}

export async function storeGetPharmacyDashboardStats(
  scope: ReportScope,
  range: { from: string; to: string },
  todayIso: string,
) {
  return withClickHouseFallback(
    "dashboard-stats",
    async () => {
      const fromDay = range.from.slice(0, 10);
      const toDay = range.to.slice(0, 10);
      const chScope = {
        pharmacyId: scope.pharmacyId,
        branchId: scope.branchId,
      };
      const [todayTotal, period, activeCustomers, totalProducts, activeStaff] =
        await Promise.all([
          queryTodaySalesTotal(chScope, todayIso.slice(0, 10)),
          queryDashboardSalesTotals({
            ...chScope,
            fromDay,
            toDay,
          }),
          queryActiveCustomerCount(chScope, range),
          countMedicationsForPharmacy(scope.pharmacyId),
          countActiveStaffForPharmacy(scope.pharmacyId),
        ]);

      return {
        totalProducts,
        lowStockItems: 0,
        todaySales: Math.round(todayTotal),
        monthlyRevenue: Math.round(period.revenue),
        totalCustomers: activeCustomers,
        activeStaff,
        pendingOrders: period.orders,
        expiringProducts: 0,
        branchId: scope.branchId ?? null,
      };
    },
    async () => {
      const [todayTotal, rangeSales, totalProducts, activeStaff] =
        await Promise.all([
          fetchTodaySalesTotal(scope, todayIso),
          fetchRangeSalesRows(scope, range),
          countMedicationsForPharmacy(scope.pharmacyId),
          countActiveStaffForPharmacy(scope.pharmacyId),
        ]);

      const monthlyRevenue = rangeSales.reduce(
        (sum, row) => sum + row.total_amount,
        0,
      );

      return buildPharmacyDashboardStats({
        todayTotal,
        monthlyRevenue,
        rangeSales,
        totalProducts,
        activeStaff,
        branchId: scope.branchId,
      });
    },
  );
}

export async function storeGetLegacyDashboard(pharmacyId: string) {
  const [stats, alerts, recentSales] = await Promise.all([
    fetchLegacyDashboardStats(pharmacyId),
    fetchLegacyInventoryAlerts(pharmacyId),
    fetchRecentSalesWithItems(pharmacyId),
  ]);

  return { stats, alerts, recentSales };
}

export async function storeGetSalesChart(scope: ReportScope) {
  return withClickHouseFallback(
    "sales-chart",
    () =>
      queryMonthlySalesChart({
        pharmacyId: scope.pharmacyId,
        branchId: scope.branchId,
      }),
    async () => {
      const since = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
      const rows = await fetchSalesSince(scope, since);
      return buildMonthlySalesChart(rows);
    },
  );
}

export async function storeGetInventoryChart(pharmacyId: string) {
  const rows = await fetchInventoryChartRows(pharmacyId);
  return buildInventoryChart(rows);
}

export async function storeGetCategorySales(scope: ReportScope) {
  return withClickHouseFallback(
    "category-sales",
    () =>
      queryCategorySalesChart({
        pharmacyId: scope.pharmacyId,
        branchId: scope.branchId,
      }),
    async () => {
      const rows = await fetchCategorySaleItemRows(scope);
      return buildCategorySalesChart(rows);
    },
  );
}

export async function storeGetWeeklySales(scope: ReportScope) {
  return withClickHouseFallback(
    "weekly-sales",
    () =>
      queryWeeklySalesChart({
        pharmacyId: scope.pharmacyId,
        branchId: scope.branchId,
      }),
    async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const rows = await fetchWeeklySaleItemRows(scope, since);
      return buildWeeklySalesChart(rows);
    },
  );
}
