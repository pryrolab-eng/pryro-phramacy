"use client";

import { useMemo } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useCustomers } from "@/hooks/useCustomers";
import { useInventoryList } from "@/hooks/useInventory";
import { usePrescriptions } from "@/hooks/usePrescriptions";
import { useSalesList } from "@/hooks/useSales";
import { useSaasBranches } from "@/hooks/useSaasSubscription";
import { useUsers } from "@/hooks/useUsers";
import {
  filterAdminPharmaciesFromCache,
  mergeAdminGlobalSearch,
} from "@/lib/search/filter-admin-global";
import { filterPharmacyGlobalSearch } from "@/lib/search/filter-pharmacy-global";
import { MIN_GLOBAL_SEARCH_LENGTH } from "@/lib/search/escape-ilike";
import { SEARCH_DEBOUNCE_MS } from "@/lib/search/constants";
import { searchAdminData, searchPharmacyData } from "@/lib/http/search";
import type {
  AdminGlobalSearchResult,
  PharmacyGlobalSearchResult,
} from "@/lib/search/types";
import { useAdminPharmacies } from "@/hooks/useAdminPharmacies";

export const pharmacySearchKeys = {
  all: ["global-search", "pharmacy"] as const,
  query: (q: string) => [...pharmacySearchKeys.all, q] as const,
};

export const adminSearchKeys = {
  all: ["global-search", "admin"] as const,
  query: (q: string) => [...adminSearchKeys.all, q] as const,
};

const EMPTY_PHARMACY: PharmacyGlobalSearchResult = {
  customers: [],
  products: [],
  prescriptions: [],
  sales: [],
  staff: [],
  branches: [],
};

const EMPTY_ADMIN: AdminGlobalSearchResult = {
  pharmacies: [],
  staff: [],
  branches: [],
};

type GlobalSearchQuery<T> = Omit<
  UseQueryResult<T>,
  "data" | "isFetching" | "isPending" | "isSuccess" | "status"
> & {
  data: T;
  isFetching: boolean;
  isPending: boolean;
  isSuccess: boolean;
  status: UseQueryResult<T>["status"];
  isDebouncing: boolean;
  isFromCache: boolean;
};

export function usePharmacyGlobalSearch(
  query: string,
  enabled = true,
): GlobalSearchQuery<PharmacyGlobalSearchResult> {
  const trimmed = query.trim();
  const debouncedQuery = useDebouncedValue(trimmed, SEARCH_DEBOUNCE_MS);
  const isDebouncing =
    enabled &&
    trimmed.length >= MIN_GLOBAL_SEARCH_LENGTH &&
    trimmed !== debouncedQuery;

  const prefetch = enabled && debouncedQuery.length >= MIN_GLOBAL_SEARCH_LENGTH;

  const customersQuery = useCustomers({ enabled: prefetch });
  const inventoryQuery = useInventoryList({ enabled: prefetch });
  const prescriptionsQuery = usePrescriptions({ enabled: prefetch });
  const salesQuery = useSalesList(
    { period: "all", limit: 200 },
    { enabled: prefetch },
  );
  const staffQuery = useUsers({ enabled: prefetch });
  const branchesQuery = useSaasBranches({ enabled: prefetch });

  const cachePending =
    customersQuery.isPending ||
    inventoryQuery.isPending ||
    prescriptionsQuery.isPending ||
    salesQuery.isPending ||
    staffQuery.isPending ||
    branchesQuery.isPending;

  const hasCachedLists =
    customersQuery.data !== undefined &&
    inventoryQuery.data !== undefined &&
    prescriptionsQuery.data !== undefined &&
    salesQuery.data?.sales !== undefined &&
    staffQuery.data !== undefined &&
    branchesQuery.data !== undefined;

  const localData = useMemo(() => {
    if (!hasCachedLists || debouncedQuery.length < MIN_GLOBAL_SEARCH_LENGTH) {
      return EMPTY_PHARMACY;
    }
    return filterPharmacyGlobalSearch({
      query: debouncedQuery,
      customers: customersQuery.data,
      inventory: inventoryQuery.data,
      prescriptions: prescriptionsQuery.data,
      sales: salesQuery.data?.sales,
      staff: staffQuery.data,
      branches: branchesQuery.data,
    });
  }, [
    hasCachedLists,
    debouncedQuery,
    customersQuery.data,
    inventoryQuery.data,
    prescriptionsQuery.data,
    salesQuery.data?.sales,
    staffQuery.data,
    branchesQuery.data,
  ]);

  const cacheError =
    customersQuery.isError ||
    inventoryQuery.isError ||
    prescriptionsQuery.isError ||
    salesQuery.isError ||
    staffQuery.isError ||
    branchesQuery.isError;

  const serverQuery = useQuery({
    queryKey: pharmacySearchKeys.query(debouncedQuery),
    queryFn: () => searchPharmacyData(debouncedQuery),
    enabled:
      prefetch &&
      !hasCachedLists &&
      !cachePending &&
      (cacheError || debouncedQuery.length >= MIN_GLOBAL_SEARCH_LENGTH),
    staleTime: SEARCH_DEBOUNCE_MS,
  });

  const data = hasCachedLists ? localData : (serverQuery.data ?? EMPTY_PHARMACY);
  const isFetching =
    isDebouncing || cachePending || (!hasCachedLists && serverQuery.isFetching);

  return {
    ...serverQuery,
    data,
    isFetching,
    isDebouncing,
    isFromCache: hasCachedLists,
    isPending: cachePending,
    isSuccess: hasCachedLists || serverQuery.isSuccess,
    status: hasCachedLists ? "success" : serverQuery.status,
  };
}

export function useAdminGlobalSearch(
  query: string,
  enabled = true,
): GlobalSearchQuery<AdminGlobalSearchResult> {
  const trimmed = query.trim();
  const debouncedQuery = useDebouncedValue(trimmed, SEARCH_DEBOUNCE_MS);
  const isDebouncing =
    enabled &&
    trimmed.length >= MIN_GLOBAL_SEARCH_LENGTH &&
    trimmed !== debouncedQuery;

  const prefetch = enabled && debouncedQuery.length >= MIN_GLOBAL_SEARCH_LENGTH;
  const pharmaciesQuery = useAdminPharmacies({ enabled: prefetch });
  const hasPharmacyCache = pharmaciesQuery.data !== undefined;

  const cachedPharmacies = useMemo(() => {
    if (!hasPharmacyCache || debouncedQuery.length < MIN_GLOBAL_SEARCH_LENGTH) {
      return [];
    }
    return filterAdminPharmaciesFromCache(pharmaciesQuery.data!, debouncedQuery);
  }, [hasPharmacyCache, pharmaciesQuery.data, debouncedQuery]);

  const serverQuery = useQuery({
    queryKey: adminSearchKeys.query(debouncedQuery),
    queryFn: () => searchAdminData(debouncedQuery),
    enabled:
      prefetch &&
      (!hasPharmacyCache || debouncedQuery.length >= MIN_GLOBAL_SEARCH_LENGTH),
    staleTime: SEARCH_DEBOUNCE_MS,
  });

  const data = useMemo(
    () =>
      mergeAdminGlobalSearch(
        cachedPharmacies,
        serverQuery.data,
        hasPharmacyCache,
      ),
    [cachedPharmacies, serverQuery.data, hasPharmacyCache],
  );

  const isFetching =
    isDebouncing ||
    pharmaciesQuery.isPending ||
    serverQuery.isFetching;

  return {
    ...serverQuery,
    data,
    isFetching,
    isDebouncing,
    isFromCache: hasPharmacyCache,
    isPending: pharmaciesQuery.isPending && serverQuery.isPending,
    isSuccess: hasPharmacyCache || serverQuery.isSuccess,
    status:
      hasPharmacyCache && serverQuery.isSuccess
        ? "success"
        : serverQuery.status,
  };
}
