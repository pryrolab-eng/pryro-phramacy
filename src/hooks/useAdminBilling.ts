"use client";

import { adminBillingQueryKey, getAdminBilling } from "@/lib/http/admin/billing";
import { useQuery } from "@tanstack/react-query";
import { adminListQueryDefaults } from "@/lib/query/admin-query-options";

export { adminBillingQueryKey };

export function useAdminBilling(options?: { enabled?: boolean }) {
  return useQuery({
    ...adminListQueryDefaults,
    queryKey: adminBillingQueryKey,
    queryFn: getAdminBilling,
    enabled: options?.enabled ?? true,
  });
}
