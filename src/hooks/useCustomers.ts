"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCustomer,
  customersKeys,
  getCustomers,
  searchCustomers,
  type CreateCustomerInput,
  type CustomerRow,
  type CustomerSearchRow,
} from "@/lib/http/customers";

export {
  customersKeys,
  type CreateCustomerInput,
  type CustomerRow,
  type CustomerSearchRow,
} from "@/lib/http/customers";

export function useCustomers(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: customersKeys.list(),
    queryFn: getCustomers,
    enabled: options?.enabled ?? true,
  });
}

export function useCustomerSearch(query: string) {
  return useQuery({
    queryKey: customersKeys.search(query),
    queryFn: () => searchCustomers(query),
    enabled: query.trim().length >= 2,
  });
}

export function useCreateCustomerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: customersKeys.all }),
  });
}
