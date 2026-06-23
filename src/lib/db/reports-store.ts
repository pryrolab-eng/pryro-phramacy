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

export async function storeGetSalesReport(
  scope: ReportScope,
  range: { from: string; to: string },
) {
  const [salesData, topProductsData] = await Promise.all([
    fetchSalesReportRows(scope, range),
    fetchSaleItemsReportRows(scope, range),
  ]);
  return {
    ...buildSalesReportPayload(salesData, topProductsData),
    branchId: scope.branchId ?? null,
  };
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
  const [todayTotal, rangeSales, totalProducts, activeStaff] = await Promise.all([
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
  const since = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
  const rows = await fetchSalesSince(scope, since);
  return buildMonthlySalesChart(rows);
}

export async function storeGetInventoryChart(pharmacyId: string) {
  const rows = await fetchInventoryChartRows(pharmacyId);
  return buildInventoryChart(rows);
}

export async function storeGetCategorySales(scope: ReportScope) {
  const rows = await fetchCategorySaleItemRows(scope);
  return buildCategorySalesChart(rows);
}

export async function storeGetWeeklySales(scope: ReportScope) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const rows = await fetchWeeklySaleItemRows(scope, since);
  return buildWeeklySalesChart(rows);
}
