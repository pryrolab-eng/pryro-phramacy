import { defaultReportRange } from "@/lib/pharmacy/branch-scope";
import {
  storeGetPharmacyDashboardStats,
  storeGetSalesChart,
  storeGetWeeklySales,
  storeGetCategorySales,
  storeGetInventoryChart,
} from "@/lib/db/reports-store";
import { fetchRecentPosSalesRows } from "@/lib/db/reports";
import {
  storeStockAlerts,
  type StockAlertItem,
} from "@/lib/db/inventory-store";
import { cacheGet, cacheSet } from "@/lib/cache/redis-cache";
import type {
  CombinedDashboardData,
  StockAlertRow,
  StockAlertsResponse,
} from "@/lib/http/pharmacy-dashboard";

const REDIS_TTL = 300; // 5 minutes

function mapStockAlertItem(item: StockAlertItem): StockAlertRow {
  const expiry = item.expiry ? new Date(item.expiry) : null;
  const expiresIn =
    expiry && !Number.isNaN(expiry.getTime())
      ? Math.ceil(
          (expiry.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
        )
      : 0;

  return {
    id: item.id,
    product: item.name,
    current_stock: item.quantity ?? 0,
    min_stock: item.minimum ?? 0,
    category: item.category,
    expires_in: expiresIn,
  };
}

function mapStockAlerts(alerts: {
  all: StockAlertItem[];
  lowStock: StockAlertItem[];
  expiring: StockAlertItem[];
}): StockAlertsResponse {
  return {
    all: alerts.all.map(mapStockAlertItem),
    lowStock: alerts.lowStock.map(mapStockAlertItem),
    expiring: alerts.expiring.map(mapStockAlertItem),
  };
}

const EMPTY_DASHBOARD: CombinedDashboardData = {
  stats: {
    totalProducts: 0,
    lowStockItems: 0,
    todaySales: 0,
    monthlyRevenue: 0,
    totalCustomers: 0,
    activeStaff: 0,
    pendingOrders: 0,
    expiringProducts: 0,
  },
  recentSales: [],
  stockAlerts: { all: [], lowStock: [], expiring: [] },
  salesChart: [],
  weeklySales: [],
  categorySales: [],
  inventoryChart: [],
};

function dashboardCacheKey(
  pharmacyId: string,
  branchId: string | undefined,
  range: { from: string; to: string },
): string {
  const rangeKey = `${range.from.slice(0, 10)}_${range.to.slice(0, 10)}`;
  return `dashboard:${pharmacyId}:${branchId ?? "all"}:${rangeKey}`;
}

export async function loadCombinedDashboardData(
  pharmacyId: string,
  branchId?: string,
  range: { from: string; to: string } = defaultReportRange(30),
): Promise<CombinedDashboardData> {
  const today = new Date().toISOString().split("T")[0];
  const cacheKey = dashboardCacheKey(pharmacyId, branchId, range);

  try {
    const cached = await cacheGet(cacheKey);
    if (cached && typeof cached === "object") {
      return cached as CombinedDashboardData;
    }
  } catch {
    // Redis optional — fall through to DB
  }

  const [
    stats,
    recentSales,
    stockAlerts,
    salesChart,
    weeklySales,
    categorySales,
    inventoryChart,
  ] = await Promise.all([
    storeGetPharmacyDashboardStats({ pharmacyId, branchId }, range, today),
    fetchRecentPosSalesRows({ pharmacyId, branchId }, 5),
    storeStockAlerts(pharmacyId, branchId),
    storeGetSalesChart({ pharmacyId, branchId }),
    storeGetWeeklySales({ pharmacyId, branchId }),
    storeGetCategorySales({ pharmacyId, branchId }),
    storeGetInventoryChart(pharmacyId),
  ]);

  const data: CombinedDashboardData = {
    stats,
    recentSales,
    stockAlerts: mapStockAlerts(stockAlerts),
    salesChart,
    weeklySales,
    categorySales,
    inventoryChart,
  };

  try {
    await cacheSet(cacheKey, data, REDIS_TTL);
  } catch {
    // ignore cache write failures
  }

  return data;
}

export function emptyCombinedDashboard(): CombinedDashboardData {
  return EMPTY_DASHBOARD;
}
