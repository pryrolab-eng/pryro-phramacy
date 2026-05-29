"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCustomer,
  customersKeys,
  deleteCustomer,
  getCustomer,
  getCustomers,
  searchCustomers,
  updateCustomer,
  type CreateCustomerInput,
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
