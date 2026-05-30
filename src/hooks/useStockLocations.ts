"use client";

import {
  createStockLocation,
  getStockLocations,
  stockLocationsQueryKey,
} from "@/lib/http/settings-locations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminListQueryDefaults } from "@/lib/query/admin-query-options";

export { stockLocationsQueryKey } from "@/lib/http/settings-locations";
export type { StockLocationRow, CreateStockLocationInput } from "@/lib/http/settings-locations";

export function useStockLocations(options?: { enabled?: boolean }) {
  return useQuery({
    ...adminListQueryDefaults,
    queryKey: stockLocationsQueryKey,
    queryFn: getStockLocations,
    enabled: options?.enabled ?? true,
  });
}

export function useCreateStockLocationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createStockLocation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: stockLocationsQueryKey });
    },
  });
}
