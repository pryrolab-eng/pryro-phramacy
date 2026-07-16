import { fetchJson } from "./client";
import {
  buildBranchScopeQueryString,
  type BranchScopeQuery,
} from "@/lib/pharmacy/branch-scope";

export const reportsKeys = {
  all: ["reports"] as const,
  sales: (scope?: BranchScopeQuery) =>
    [...reportsKeys.all, "sales", scope ?? {}] as const,
  inventory: () => [...reportsKeys.all, "inventory"] as const,
  insuranceClaims: (month: number, year: number, providerId?: string | null) =>
    [...reportsKeys.all, "insurance-claims", month, year, providerId ?? "all"] as const,
  combined: (scope?: BranchScopeQuery) =>
    [...reportsKeys.all, "combined", scope ?? {}] as const,
};

export type CombinedReportsData = {
  salesReport: ReportsSalesData;
  inventoryReport: ReportsInventoryData;
  categorySales: unknown[];
  dashboardStats: {
    totalProducts: number;
    lowStockItems: number;
    todaySales: number;
    monthlyRevenue: number;
    totalCustomers: number;
    activeStaff: number;
    pendingOrders: number;
    expiringProducts: number;
  };
};

export async function getCombinedReportsData(
  scope?: BranchScopeQuery,
): Promise<CombinedReportsData> {
  const params = new URLSearchParams();
  if (scope?.branchId) params.set("branchId", scope.branchId);
  if (scope?.from) params.set("from", scope.from);
  if (scope?.to) params.set("to", scope.to);
  const query = params.toString();
  return fetchJson<CombinedReportsData>(
    `/api/reports/combined${query ? `?${query}` : ""}`,
  );
}

export type ReportsSalesData = {
  dailySales: Array<{ date: string; sales?: number; orders?: number }>;
  topProducts: Array<{ name: string; quantity: number; sales: number }>;
  paymentBreakdown: Array<{ method: string; amount: number; percentage: number }>;
  totalSales: number;
  totalOrders: number;
  activeCustomers: number;
};

export type ReportsInventoryData = {
  inventoryAlerts: Array<{
    date: string;
    lowStock?: number;
    expiring?: number;
    totalItems?: number;
  }>;
};

const EMPTY_SALES: ReportsSalesData = {
  dailySales: [],
  topProducts: [],
  paymentBreakdown: [],
  totalSales: 0,
  totalOrders: 0,
  activeCustomers: 0,
};

export async function getReportsSales(
  scope?: BranchScopeQuery,
): Promise<ReportsSalesData> {
  try {
    return await fetchJson<ReportsSalesData>(
      `/api/reports/sales${buildBranchScopeQueryString(scope ?? {})}`,
    );
  } catch {
    return EMPTY_SALES;
  }
}

export async function getReportsInventory(): Promise<ReportsInventoryData> {
  try {
    return await fetchJson<ReportsInventoryData>("/api/reports/inventory");
  } catch {
    return { inventoryAlerts: [] };
  }
}
