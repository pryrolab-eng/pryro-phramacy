"use client";

import {
  adminTransactionsQueryKey,
  getAdminTransactions,
} from "@/lib/http/admin/transactions";
import { useQuery } from "@tanstack/react-query";
import { adminListQueryDefaults } from "@/lib/query/admin-query-options";

export { adminTransactionsQueryKey };

export function useAdminTransactions(options?: { enabled?: boolean }) {
  return useQuery({
    ...adminListQueryDefaults,
    queryKey: adminTransactionsQueryKey,
    queryFn: getAdminTransactions,
    enabled: options?.enabled ?? true,
  });
}
