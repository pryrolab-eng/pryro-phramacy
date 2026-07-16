"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { filterCustomersForSearch } from "@/lib/customers/search-customers";
import {
  MIN_SEARCH_LENGTH,
  SEARCH_DEBOUNCE_MS,
  SEARCH_LIST_STALE_MS,
} from "@/lib/search/constants";
import {
  createCustomer,
  customersKeys,
  deleteCustomer,
  getCombinedCustomersData,
  getCustomer,
  getCustomers,
  importCustomers,
  searchCustomers,
  updateCustomer,
  type CombinedCustomersData,
  type CreateCustomerInput,
  type CustomerImportResult,
  type CustomerRow,
  type CustomerSearchRow,
  type UpdateCustomerInput,
} from "@/lib/http/customers";

export {
  customersKeys,
  type CreateCustomerInput,
  type CustomerRow,
  type CustomerSearchRow,
  type UpdateCustomerInput,
} from "@/lib/http/customers";

export function useCustomers(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: customersKeys.list(),
    queryFn: getCustomers,
    enabled: options?.enabled ?? true,
    staleTime: SEARCH_LIST_STALE_MS,
  });
}

export type CustomerSearchResult = {
  data: CustomerSearchRow[];
  isFetching: boolean;
  isDebouncing: boolean;
  /** True when results come from the local list cache (no per-search API call). */
  isFromCache: boolean;
};

export function useCustomerSearch(query: string): CustomerSearchResult {
  const trimmed = query.trim();
  const debouncedQuery = useDebouncedValue(trimmed, SEARCH_DEBOUNCE_MS);
  const isDebouncing =
    trimmed.length >= MIN_SEARCH_LENGTH &&
    trimmed !== debouncedQuery;

  const listQuery = useCustomers();
  const hasCachedList = listQuery.data !== undefined;

  const localResults = useMemo(() => {
    if (!hasCachedList || debouncedQuery.length < MIN_SEARCH_LENGTH) {
      return [];
    }
    return filterCustomersForSearch(listQuery.data!, debouncedQuery, 5);
  }, [hasCachedList, listQuery.data, debouncedQuery]);

  const serverQuery = useQuery({
    queryKey: customersKeys.search(debouncedQuery),
    queryFn: () => searchCustomers(debouncedQuery),
    enabled:
      debouncedQuery.length >= MIN_SEARCH_LENGTH &&
      !hasCachedList &&
      !listQuery.isPending &&
      listQuery.isError,
    staleTime: 20_000,
  });

  const data = hasCachedList ? localResults : (serverQuery.data ?? []);
  const isFetching =
    isDebouncing ||
    listQuery.isPending ||
    (!hasCachedList && serverQuery.isFetching);

  return {
    data,
    isFetching,
    isDebouncing,
    isFromCache: hasCachedList,
  };
}

export function useCreateCustomerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: customersKeys.all }),
  });
}

export function useImportCustomersMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importCustomers,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: customersKeys.all }),
  });
}

export function useCustomer(id: string | null) {
  return useQuery({
    queryKey: customersKeys.detail(id ?? ""),
    queryFn: () => getCustomer(id!),
    enabled: Boolean(id),
  });
}

export function useUpdateCustomerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateCustomerInput }) =>
      updateCustomer(id, body),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: customersKeys.all });
      void queryClient.invalidateQueries({ queryKey: customersKeys.detail(id) });
    },
  });
}

export function useDeleteCustomerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: customersKeys.all }),
  });
}

export type { CombinedCustomersData } from "@/lib/http/customers";

const COMBINED_STALE_MS = 10 * 60 * 1000;
const COMBINED_GC_MS = 30 * 60 * 1000;

export function useCombinedCustomers(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: customersKeys.combined(),
    queryFn: getCombinedCustomersData,
    enabled: options?.enabled ?? true,
    staleTime: COMBINED_STALE_MS,
    gcTime: COMBINED_GC_MS,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
