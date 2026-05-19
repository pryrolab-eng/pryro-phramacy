"use client";

import {
  adminTransactionsQueryKey,
  getAdminTransactions,
} from "@/lib/http/admin/transactions";
import { useQuery } from "@tanstack/react-query";

export { adminTransactionsQueryKey };

export function useAdminTransactions(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminTransactionsQueryKey,
    queryFn: getAdminTransactions,
    enabled: options?.enabled ?? true,
  });
}
