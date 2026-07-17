import { fetchJson } from "./client";
import {
  buildBranchScopeQueryString,
  branchScopeCacheKey,
  type BranchScopeQuery,
} from "@/lib/pharmacy/branch-scope";

export type PharmacyDashboardStats = {
  totalProducts: number;
  lowStockItems: number;
  todaySales: number;
  monthlyRevenue: number;
  totalCustomers: number;
  activeStaff: number;
  pendingOrders: number;
  expiringProducts: number;
};

export type RecentSaleRow = {
  id: string;
  customer: string;
  amount: number;
  items: number;
  time: string;
  payment_method: string;
};

export type StockAlertRow = {
  id: string;
  product: string;
  current_stock: number;
  min_stock: number;
  category: string;
  expires_in: number;
};

export type StockAlertsResponse = {
  all: StockAlertRow[];
  lowStock: StockAlertRow[];
  expiring: StockAlertRow[];
};

export type SalesChartPoint = {
  month: string;
  revenue: number;
};

export type WeeklySalesChartPoint = {
  day: string;
  prescription: number;
  otc: number;
};

export type CategorySalesChartPoint = {
  category: string;
  sales: number;
  fill: string;
};

export type InventoryChartPoint = {
  month: string;
  inStock: number;
  lowStock: number;
};

export const pharmacyDashboardKeys = {
  all: ["pharmacy", "dashboard"] as const,
  stats: (branchId?: string, days = 30) =>
    [
      ...pharmacyDashboardKeys.all,
      "stats",
      ...branchScopeCacheKey(branchId, days),
    ] as const,
  recentSales: (branchId?: string, days = 30) =>
    [
      ...pharmacyDashboardKeys.all,
      "recent-sales",
      ...branchScopeCacheKey(branchId, days),
    ] as const,
  stockAlerts: (branchId?: string | null) => [...pharmacyDashboardKeys.all, "stock-alerts", branchId ?? "all"] as const,
  salesChart: () => [...pharmacyDashboardKeys.all, "sales-chart"] as const,
  weeklySales: () => [...pharmacyDashboardKeys.all, "weekly-sales"] as const,
  categorySales: () => [...pharmacyDashboardKeys.all, "category-sales"] as const,
  inventoryChart: () => [...pharmacyDashboardKeys.all, "inventory-chart"] as const,
  combined: (branchId?: string, days = 30) =>
    [
      ...pharmacyDashboardKeys.all,
      "combined",
      ...branchScopeCacheKey(branchId, days),
    ] as const,
};

const EMPTY_STATS: PharmacyDashboardStats = {
  totalProducts: 0,
  lowStockItems: 0,
  todaySales: 0,
  monthlyRevenue: 0,
  totalCustomers: 0,
  activeStaff: 0,
  pendingOrders: 0,
  expiringProducts: 0,
};

const EMPTY_STOCK_ALERTS: StockAlertsResponse = {
  all: [],
  lowStock: [],
  expiring: [],
};

export async function getPharmacyDashboardStats(
  scope?: BranchScopeQuery,
): Promise<PharmacyDashboardStats> {
  try {
    return await fetchJson<PharmacyDashboardStats>(
      `/api/pharmacy/dashboard${buildBranchScopeQueryString(scope ?? {})}`,
    );
  } catch {
    return EMPTY_STATS;
  }
}

export async function getRecentPosSales(
  scope?: BranchScopeQuery,
): Promise<RecentSaleRow[]> {
  try {
    return await fetchJson<RecentSaleRow[]>(
      `/api/pos${buildBranchScopeQueryString(scope ?? {})}`,
    );
  } catch {
    return [];
  }
}

export async function getStockAlerts(branchId?: string | null): Promise<StockAlertsResponse> {
  try {
    const params = new URLSearchParams();
    if (branchId && branchId !== "all") {
      params.set("branchId", branchId);
    }
    const url = params.toString() ? `/api/stock-alerts?${params}` : "/api/stock-alerts";
    return await fetchJson<StockAlertsResponse>(url);
  } catch {
    return EMPTY_STOCK_ALERTS;
  }
}

export async function getPharmacySalesChart(): Promise<SalesChartPoint[]> {
  try {
    return await fetchJson<SalesChartPoint[]>("/api/pharmacy/sales-chart");
  } catch {
    return [];
  }
}

const FALLBACK_WEEKLY_SALES: WeeklySalesChartPoint[] = [
  { day: "Mon", prescription: 450, otc: 300 },
  { day: "Tue", prescription: 380, otc: 420 },
];

const FALLBACK_CATEGORY_SALES: CategorySalesChartPoint[] = [
  { category: "prescription", sales: 275, fill: "var(--color-prescription)" },
  { category: "otc", sales: 200, fill: "var(--color-otc)" },
];

export async function getPharmacyWeeklySalesChart(): Promise<WeeklySalesChartPoint[]> {
  try {
    const data = await fetchJson<WeeklySalesChartPoint[]>(
      "/api/pharmacy/weekly-sales",
    );
    return Array.isArray(data) && data.length > 0 ? data : FALLBACK_WEEKLY_SALES;
  } catch {
    return FALLBACK_WEEKLY_SALES;
  }
}

export async function getPharmacyCategorySalesChart(): Promise<
  CategorySalesChartPoint[]
> {
  try {
    const data = await fetchJson<CategorySalesChartPoint[]>(
      "/api/pharmacy/category-sales",
    );
    return Array.isArray(data) && data.length > 0
      ? data
      : FALLBACK_CATEGORY_SALES;
  } catch {
    return FALLBACK_CATEGORY_SALES;
  }
}

export async function getPharmacyInventoryChart(): Promise<InventoryChartPoint[]> {
  try {
    const data = await fetchJson<InventoryChartPoint[]>(
      "/api/pharmacy/inventory-chart",
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export type CombinedDashboardData = {
  stats: PharmacyDashboardStats;
  recentSales: RecentSaleRow[];
  stockAlerts: StockAlertsResponse;
  salesChart: SalesChartPoint[];
  weeklySales: WeeklySalesChartPoint[];
  categorySales: CategorySalesChartPoint[];
  inventoryChart: InventoryChartPoint[];
};

export async function getCombinedDashboardData(
  scope?: BranchScopeQuery,
): Promise<CombinedDashboardData> {
  try {
    return await fetchJson<CombinedDashboardData>(
      `/api/pharmacy/dashboard/combined${buildBranchScopeQueryString(scope ?? {})}`,
    );
  } catch {
    return {
      stats: EMPTY_STATS,
      recentSales: [],
      stockAlerts: EMPTY_STOCK_ALERTS,
      salesChart: [],
      weeklySales: FALLBACK_WEEKLY_SALES,
      categorySales: FALLBACK_CATEGORY_SALES,
      inventoryChart: [],
    };
  }
}
