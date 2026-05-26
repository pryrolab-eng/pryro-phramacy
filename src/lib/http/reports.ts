import { fetchJson } from "./client";

export const reportsKeys = {
  all: ["reports"] as const,
  sales: () => [...reportsKeys.all, "sales"] as const,
  inventory: () => [...reportsKeys.all, "inventory"] as const,
};

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

export async function getReportsSales(): Promise<ReportsSalesData> {
  try {
    return await fetchJson<ReportsSalesData>("/api/reports/sales");
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
