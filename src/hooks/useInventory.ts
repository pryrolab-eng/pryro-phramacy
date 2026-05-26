"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  getInventoryAnalytics,
  getInventoryList,
  getInventorySuppliers,
  inventoryKeys,
  purchaseInventoryStock,
  transferInventoryStock,
  updateInventoryProduct,
  type AddInventoryProductInput,
  type InventoryAnalytics,
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

function invalidateInventory(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: inventoryKeys.list() }),
    queryClient.invalidateQueries({ queryKey: inventoryKeys.analytics() }),
  ]);
}

export function useInventoryList(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: inventoryKeys.list(),
    queryFn: getInventoryList,
    enabled: options?.enabled ?? true,
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
    invalidateAll: () => invalidateInventory(queryClient),
    invalidateList: () =>
      queryClient.invalidateQueries({ queryKey: inventoryKeys.list() }),
    invalidateAnalytics: () =>
      queryClient.invalidateQueries({ queryKey: inventoryKeys.analytics() }),
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
