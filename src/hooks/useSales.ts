"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getSalesAnalytics,
  getSalesList,
  salesKeys,
  type SaleRow,
  type SalesAnalytics,
  type SalesListResponse,
} from "@/lib/http/sales";

export { salesKeys, type SaleRow, type SalesAnalytics, type SalesListResponse } from "@/lib/http/sales";

export function useSalesList(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: salesKeys.list(),
    queryFn: getSalesList,
    enabled: options?.enabled ?? true,
  });
}

export function useSalesAnalytics(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: salesKeys.analytics(),
    queryFn: getSalesAnalytics,
    enabled: options?.enabled ?? true,
  });
}
