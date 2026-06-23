import { fetchJson } from "./client";
import {
  buildSalesListQueryString,
  type SalesListPeriod,
} from "@/lib/sales/list-query";

export type SalesListParams = {
  period?: SalesListPeriod;
  q?: string;
  from?: string;
  to?: string;
  limit?: number;
};

export const salesKeys = {
  all: ["sales"] as const,
  list: (params?: SalesListParams) =>
    [...salesKeys.all, "list", params ?? {}] as const,
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
  monthlyComparison: Array<{ week?: string; current: number; previous: number }>;
  customerDistribution: Array<{ name: string; value: number; fill?: string }>;
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

export async function getSalesList(
  params?: SalesListParams,
): Promise<SalesListResponse> {
  try {
    return await fetchJson<SalesListResponse>(
      `/api/sales${buildSalesListQueryString(params ?? {})}`,
    );
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
