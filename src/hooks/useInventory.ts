"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SEARCH_LIST_STALE_MS } from "@/lib/search/constants";
import {
  createPharmacyCategory,
  getPharmacyCategoriesCatalog,
  pharmacyCategoriesCatalogQueryKey,
} from "@/lib/http/catalog";
import {
  addInventoryProduct,
  adjustInventoryStock,
  createInventorySupplier,
  deleteInventoryProduct,
  getCombinedInventoryData,
  getInventoryAnalytics,
  getInventoryList,
  getInventorySuppliers,
  importInventoryProducts,
  inventoryKeys,
  purchaseInventoryStock,
  transferInventoryStock,
  updateInventoryProduct,
  type AddInventoryProductInput,
  type CombinedInventoryData,
  type InventoryAnalytics,
  type InventoryImportResult,
  type InventoryListRow,
  type InventorySupplier,
  type UpdateInventoryProductInput,
} from "@/lib/http/inventory";

export {
  inventoryKeys,
  type AddInventoryProductInput,
  type InventoryAnalytics,
  type InventoryListRow,
  type InventorySupplier,
  type UpdateInventoryProductInput,
} from "@/lib/http/inventory";

function invalidateInventory(queryClient: ReturnType<typeof useQueryClient>, branchId?: string | null) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: inventoryKeys.list(branchId) }),
    queryClient.invalidateQueries({ queryKey: inventoryKeys.analytics(branchId) }),
  ]);
}

export function useInventoryList(options?: { enabled?: boolean; branchId?: string | null }) {
  const branchId = options?.branchId;
  return useQuery({
    queryKey: inventoryKeys.list(branchId),
    queryFn: () => getInventoryList(branchId),
    enabled: options?.enabled ?? true,
    staleTime: SEARCH_LIST_STALE_MS,
  });
}

export function useInventoryAnalytics(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: inventoryKeys.analytics(),
    queryFn: getInventoryAnalytics,
    enabled: options?.enabled ?? true,
  });
}

export function useInventorySuppliers(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: inventoryKeys.suppliers(),
    queryFn: getInventorySuppliers,
    enabled: options?.enabled ?? true,
  });
}

export function useInventoryCategories(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: pharmacyCategoriesCatalogQueryKey,
    queryFn: getPharmacyCategoriesCatalog,
    enabled: options?.enabled ?? true,
  });
}

export function useInvalidateInventory() {
  const queryClient = useQueryClient();
  return {
    invalidateAll: (branchId?: string | null) => invalidateInventory(queryClient, branchId),
    invalidateList: (branchId?: string | null) =>
      queryClient.invalidateQueries({ queryKey: inventoryKeys.list(branchId) }),
    invalidateAnalytics: (branchId?: string | null) =>
      queryClient.invalidateQueries({ queryKey: inventoryKeys.analytics(branchId) }),
    invalidateSuppliers: () =>
      queryClient.invalidateQueries({ queryKey: inventoryKeys.suppliers() }),
    invalidateCategories: () =>
      queryClient.invalidateQueries({
        queryKey: pharmacyCategoriesCatalogQueryKey,
      }),
  };
}

export function useAddInventoryProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addInventoryProduct,
    onSuccess: () => invalidateInventory(queryClient),
  });
}

export function useImportInventoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importInventoryProducts,
    onSuccess: () => invalidateInventory(queryClient),
  });
}

export function useCreateInventorySupplierMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInventorySupplier,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: inventoryKeys.suppliers() }),
  });
}

export function useAdjustInventoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adjustInventoryStock,
    onSuccess: () => invalidateInventory(queryClient),
  });
}

export function usePurchaseInventoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: purchaseInventoryStock,
    onSuccess: () => invalidateInventory(queryClient),
  });
}

export function useTransferInventoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: transferInventoryStock,
    onSuccess: () => invalidateInventory(queryClient),
  });
}

export function useDeleteInventoryProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteInventoryProduct,
    onSuccess: () => invalidateInventory(queryClient),
  });
}

export function useUpdateInventoryProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: UpdateInventoryProductInput;
    }) => updateInventoryProduct(id, body),
    onSuccess: () => invalidateInventory(queryClient),
  });
}

export function useCreateInventoryCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createPharmacyCategory(name),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: pharmacyCategoriesCatalogQueryKey,
      }),
  });
}

export type { CombinedInventoryData } from "@/lib/http/inventory";

const COMBINED_STALE_MS = 10 * 60 * 1000;
const COMBINED_GC_MS = 30 * 60 * 1000;

export function useCombinedInventory(options?: {
  enabled?: boolean;
  branchId?: string | null;
}) {
  return useQuery({
    queryKey: inventoryKeys.combined(options?.branchId),
    queryFn: () => getCombinedInventoryData(options?.branchId),
    enabled: options?.enabled ?? true,
    staleTime: COMBINED_STALE_MS,
    gcTime: COMBINED_GC_MS,
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: (previousData) => previousData,
  });
}
