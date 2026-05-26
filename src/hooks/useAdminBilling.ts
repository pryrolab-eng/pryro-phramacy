"use client";

import { adminBillingQueryKey, getAdminBilling } from "@/lib/http/admin/billing";
import { useQuery } from "@tanstack/react-query";

export { adminBillingQueryKey };

export function useAdminBilling(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminBillingQueryKey,
    queryFn: getAdminBilling,
    enabled: options?.enabled ?? true,
  });
}
