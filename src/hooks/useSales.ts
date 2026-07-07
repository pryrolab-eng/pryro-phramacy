"use client";

import { useQuery } from "@tanstack/react-query";
import { SEARCH_LIST_STALE_MS } from "@/lib/search/constants";
import {
  getSalesAnalytics,
  getSalesList,
  salesKeys,
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
