"use client";

import { useQuery } from "@tanstack/react-query";
import { SEARCH_LIST_STALE_MS } from "@/lib/search/constants";
import {
  getCombinedSalesData,
  getSalesAnalytics,
  getSalesList,
  salesKeys,
  type CombinedSalesData,
  type SaleRow,
  type SalesAnalytics,
  type SalesListParams,
  type SalesListResponse,
} from "@/lib/http/sales";

export {
  salesKeys,
  type SaleRow,
  type SalesAnalytics,
  type SalesListParams,
  type SalesListResponse,
} from "@/lib/http/sales";

export function useSalesList(
  params?: SalesListParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: salesKeys.list(params),
    queryFn: () => getSalesList(params),
    enabled: options?.enabled ?? true,
    staleTime: SEARCH_LIST_STALE_MS,
  });
}

export function useSalesAnalytics(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: salesKeys.analytics(),
    queryFn: getSalesAnalytics,
    enabled: options?.enabled ?? true,
  });
}

export type { CombinedSalesData } from "@/lib/http/sales";

const COMBINED_STALE_MS = 10 * 60 * 1000;
const COMBINED_GC_MS = 30 * 60 * 1000;

export function useCombinedSales(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: salesKeys.combined(),
    queryFn: getCombinedSalesData,
    enabled: options?.enabled ?? true,
    staleTime: COMBINED_STALE_MS,
    gcTime: COMBINED_GC_MS,
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: (previousData) => previousData,
  });
}
