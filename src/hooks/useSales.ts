"use client";

import { useQuery } from "@tanstack/react-query";
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
  });
}

export function useSalesAnalytics(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: salesKeys.analytics(),
    queryFn: getSalesAnalytics,
    enabled: options?.enabled ?? true,
  });
}
