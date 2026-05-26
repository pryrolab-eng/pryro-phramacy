import { fetchJson } from "./client";

export const salesKeys = {
  all: ["sales"] as const,
  list: () => [...salesKeys.all, "list"] as const,
  analytics: () => [...salesKeys.all, "analytics"] as const,
};

export type SaleRow = {
  id: string;
  customer: string;
  amount: number;
  items: number;
  date: string;
  paymentMethod: string;
  status: string;
};

export type SalesListResponse = {
  sales: SaleRow[];
  stats: {
    todayTotal: number;
    weekTotal: number;
    monthTotal: number;
    totalSales: number;
  };
};

export type SalesAnalytics = {
  weeklySales: Array<{ day?: string; sales: number }>;
  paymentBreakdown: Array<{ method: string; percentage: number }>;
  hourlySales: Array<{ hour?: string; sales: number }>;
  monthlyComparison: Array<{ month?: string; sales: number }>;
  customerDistribution: Array<{ name: string; value: number }>;
  topCategories: Array<{ name: string; value: number; color: string }>;
};

const EMPTY_ANALYTICS: SalesAnalytics = {
  weeklySales: [],
  paymentBreakdown: [],
  hourlySales: [],
  monthlyComparison: [],
  customerDistribution: [],
  topCategories: [],
};

const EMPTY_LIST: SalesListResponse = {
  sales: [],
  stats: { todayTotal: 0, weekTotal: 0, monthTotal: 0, totalSales: 0 },
};

export async function getSalesList(): Promise<SalesListResponse> {
  try {
    return await fetchJson<SalesListResponse>("/api/sales");
  } catch {
    return EMPTY_LIST;
  }
}

export async function getSalesAnalytics(): Promise<SalesAnalytics> {
  try {
    return await fetchJson<SalesAnalytics>("/api/sales/analytics");
  } catch {
    return EMPTY_ANALYTICS;
  }
}
